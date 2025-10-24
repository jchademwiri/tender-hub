import { type NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, auditLog } from "@/db/schema";
import { checkPermission } from "@/lib/permissions";

// PUT /api/team/[id] - Update team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get full user data from database
    const fullUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (fullUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPermissions = checkPermission(fullUser[0]);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, status } = body;

    // Get target user
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserData = targetUser[0];

    // Check permissions for the operation
    if (role && !userPermissions.canModifyUser(targetUserData)) {
      return NextResponse.json(
        { error: "Cannot modify this user's role" },
        { status: 403 },
      );
    }

    if (status && !userPermissions.canSuspendUser(targetUserData)) {
      return NextResponse.json(
        { error: "Cannot modify this user's status" },
        { status: 403 },
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // Update user
    const updatedUser = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    // Audit log
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "team_member_updated",
      targetUserId: id,
      metadata: JSON.stringify({
        changes: updateData,
        previousData: {
          name: targetUserData.name,
          role: targetUserData.role,
          status: targetUserData.status,
        },
      }),
      ipAddress: request.headers.get("x-forwarded-for") || null,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      member: updatedUser[0],
    });
  } catch (error) {
    console.error("Team update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/team/[id] - Delete team member (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get full user data from database
    const fullUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (fullUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    // Get target user for audit log
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserData = targetUser[0];

    const userPermissions = checkPermission(fullUser[0]);
    if (!userPermissions.canDeleteUser(targetUserData)) {
      return NextResponse.json(
        { error: "Only admins can delete users" },
        { status: 403 },
      );
    }

    // Prevent deleting the last admin
    if (targetUserData.role === "admin") {
      const adminCount = await db
        .select({ count: count() })
        .from(user)
        .where(eq(user.role, "admin"));

      if (adminCount[0].count <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin" },
          { status: 400 },
        );
      }
    }

    // Delete user (cascade will handle related records)
    await db.delete(user).where(eq(user.id, id));

    // Audit log
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "team_member_deleted",
      targetUserId: id,
      metadata: JSON.stringify({
        deletedUser: {
          email: targetUserData.email,
          name: targetUserData.name,
          role: targetUserData.role,
        },
      }),
      ipAddress: request.headers.get("x-forwarded-for") || null,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Team delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/team/[id] - Get specific team member details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get full user data from database
    const fullUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (fullUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPermissions = checkPermission(fullUser[0]);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Get team member details
    const teamMember = await db
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
      .where(eq(user.id, id))
      .limit(1);

    if (teamMember.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      member: teamMember[0],
    });
  } catch (error) {
    console.error("Team member API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
