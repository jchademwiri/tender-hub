import { type NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, auditLog } from "@/db/schema";
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
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions - both admin and manager can view team
    // Get full user data from database to ensure we have all required fields
    const fullUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (fullUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userPermissions = checkPermission(fullUser[0]);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search")?.trim();
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? asc : desc;

    // Build where conditions
    const whereConditions = [];

    // Status filter
    if (status && ["active", "suspended", "pending"].includes(status)) {
      whereConditions.push(eq(user.status, status as "active" | "suspended" | "pending"));
    }

    // Role filter
    if (role && ["owner", "admin", "manager", "user"].includes(role)) {
      whereConditions.push(eq(user.role, role as "owner" | "admin" | "manager" | "user"));
    }

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
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
      case "createdAt":
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
      { status: 500 }
    );
  }
}

// POST /api/team - Create/invite new team member
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get full user data from database to ensure we have all required fields
    const fullUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (fullUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userPermissions = checkPermission(fullUser[0]);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, role } = body;

    // Validate input
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required" },
        { status: 400 }
      );
    }

    // Validate role permissions
    if (role === "admin" && !userPermissions.hasRole("admin")) {
      return NextResponse.json(
        { error: "Only admins can invite admin users" },
        { status: 403 }
      );
    }

    if (role === "manager" && !userPermissions.hasRole("admin")) {
      return NextResponse.json(
        { error: "Only admins can invite manager users" },
        { status: 403 }
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
        { status: 409 }
      );
    }

    // Create invitation (we'll use the existing invitation system)
    // For now, create a pending user directly
    const newUserId = crypto.randomUUID();
    const newUser = await db.insert(user).values({
      id: newUserId,
      name,
      email,
      role,
      status: "pending",
      invitedBy: session.user.id,
      invitedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Audit log
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "team_member_invited",
      targetUserId: newUserId,
      metadata: JSON.stringify({
        email,
        name,
        role,
      }),
      ipAddress: request.headers.get("x-forwarded-for") || null,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      member: newUser[0],
    });
  } catch (error) {
    console.error("Team invite API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
