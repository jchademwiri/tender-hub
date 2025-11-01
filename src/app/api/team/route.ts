import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { createInvitation } from "@/lib/invitation";
import { checkPermission } from "@/lib/permissions";

// Team member interface for API responses
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  invitedBy?: string | null;
  invitedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
}

// GET /api/team - List all team members (admin/manager access)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user and get full user data including role
    const session = await requireAuth();

    // Check permissions - both admin and manager can view team
    const userPermissions = checkPermission(session.user);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search")?.trim();
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? asc : desc;

    // Build where conditions
    const whereConditions = [];

    // Status filter
    if (status && ["active", "suspended", "pending"].includes(status)) {
      whereConditions.push(
        eq(user.status, status as "active" | "suspended" | "pending"),
      );
    }

    // Role filter
    if (role && ["owner", "admin", "manager", "user"].includes(role)) {
      whereConditions.push(
        eq(user.role, role as "owner" | "admin" | "manager" | "user"),
      );
    }

    // Search filter
    if (search) {
      whereConditions.push(
        or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`)),
      );
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(user)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Build sort column
    let orderBy;
    switch (sortBy) {
      case "name":
        orderBy = sortOrder(user.name);
        break;
      case "email":
        orderBy = sortOrder(user.email);
        break;
      case "role":
        orderBy = sortOrder(user.role);
        break;
      case "status":
        orderBy = sortOrder(user.status);
        break;
      default:
        orderBy = sortOrder(user.createdAt);
        break;
    }

    // Execute main query
    const teamMembers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        invitedBy: user.invitedBy,
        invitedAt: user.invitedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.updatedAt, // Using updatedAt as last activity
      })
      .from(user)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Audit log the access
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "team_members_viewed",
      metadata: JSON.stringify({
        filters: { status, role, search, sortBy, sortOrder },
        resultCount: teamMembers.length,
      }),
      ipAddress: request.headers.get("x-forwarded-for") || null,
      createdAt: new Date(),
    });

    return NextResponse.json({
      members: teamMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Team API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/team/bulk - Bulk operations for team members
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user and get full user data including role
    const session = await requireAuth();

    // Check permissions - both admin and manager can perform bulk operations
    const userPermissions = checkPermission(session.user);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action, memberIds } = body;

    // Validate input
    if (
      !action ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Action and memberIds array are required" },
        { status: 400 },
      );
    }

    if (!["suspend", "activate", "delete"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be suspend, activate, or delete" },
        { status: 400 },
      );
    }

    // Validate member IDs
    if (memberIds.length > 50) {
      return NextResponse.json(
        { error: "Cannot process more than 50 members at once" },
        { status: 400 },
      );
    }

    // Get target users for validation
    const targetUsers = await db
      .select()
      .from(user)
      .where(inArray(user.id, memberIds));

    if (targetUsers.length !== memberIds.length) {
      return NextResponse.json(
        { error: "Some members not found" },
        { status: 404 },
      );
    }

    // Validate permissions for each target user
    for (const targetUser of targetUsers) {
      if (action === "delete") {
        if (!userPermissions.canDeleteUser(targetUser)) {
          return NextResponse.json(
            { error: `Cannot delete user ${targetUser.email}` },
            { status: 403 },
          );
        }
      } else {
        if (!userPermissions.canSuspendUser(targetUser)) {
          return NextResponse.json(
            { error: `Cannot modify user ${targetUser.email}` },
            { status: 403 },
          );
        }
      }
    }

    // Special validation for delete action
    if (action === "delete") {
      const adminUsers = targetUsers.filter((u) => u.role === "admin");
      if (adminUsers.length > 0) {
        const totalAdmins = await db
          .select({ count: count() })
          .from(user)
          .where(eq(user.role, "admin"));

        if (totalAdmins[0].count - adminUsers.length <= 0) {
          return NextResponse.json(
            { error: "Cannot delete the last admin" },
            { status: 400 },
          );
        }
      }
    }

    // Execute bulk operation with transaction for atomicity
    const results: Array<{ memberId: string; success: boolean }> = [];
    const errors: Array<{ memberId: string; error: string }> = [];

    // Use a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      for (const memberId of memberIds) {
        try {
          if (action === "delete") {
            await tx.delete(user).where(eq(user.id, memberId));
            results.push({ memberId, success: true });
          } else {
            const status = action === "suspend" ? "suspended" : "active";
            await tx
              .update(user)
              .set({ status, updatedAt: new Date() })
              .where(eq(user.id, memberId));
            results.push({ memberId, success: true });
          }

          // Audit log for each operation
          await tx.insert(auditLog).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            action: `team_member_bulk_${action}`,
            targetUserId: memberId,
            metadata: JSON.stringify({
              bulkOperation: true,
              totalMembers: memberIds.length,
              action,
            }),
            ipAddress: request.headers.get("x-forwarded-for") || null,
            createdAt: new Date(),
          });
        } catch (error) {
          console.error(`Failed to ${action} member ${memberId}:`, error);
          errors.push({ memberId, error: `Failed to ${action} member` });
          // Re-throw to trigger transaction rollback
          throw error;
        }
      }
    });

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: memberIds.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Bulk team operation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/team - Create/invite new team member
export async function POST(request: NextRequest) {
  try {
    // Authenticate user and get full user data including role
    const session = await requireAuth();

    // Check permissions - both admin and manager can create team members
    const userPermissions = checkPermission(session.user);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, name, role } = body;

    // Validate input
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required" },
        { status: 400 },
      );
    }

    // Validate role permissions
    if (role === "admin" && !userPermissions.hasRole("admin")) {
      return NextResponse.json(
        { error: "Only admins can invite admin users" },
        { status: 403 },
      );
    }

    if (role === "manager" && !userPermissions.hasRole("admin")) {
      return NextResponse.json(
        { error: "Only admins can invite manager users" },
        { status: 403 },
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Create invitation using the existing invitation system
    try {
      const invitation = await createInvitation({
        email,
        role,
        invitedBy: session.user.id,
      });

      // Audit log
      await db.insert(auditLog).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "team_member_invited",
        targetUserId: invitation.id, // Use invitation ID as target
        metadata: JSON.stringify({
          email,
          name,
          role,
          invitationId: invitation.id,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || null,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        invitation: invitation,
      });
    } catch (invitationError) {
      console.error("Failed to create invitation:", invitationError);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Team invite API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
