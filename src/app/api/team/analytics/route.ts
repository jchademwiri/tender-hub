import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InvitationAnalyticsCache } from "@/lib/invitation-analytics-cache";
import { checkPermission } from "@/lib/permissions";

interface TeamAnalytics {
  overview: {
    totalMembers: number;
    activeMembers: number;
    suspendedMembers: number;
    pendingMembers: number;
    conversionRate: number;
  };
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  activityTrends: Array<{
    date: string;
    newMembers: number;
    activeMembers: number;
    suspendedMembers: number;
  }>;
  invitationMetrics: {
    totalInvitations: number;
    acceptedInvitations: number;
    pendingInvitations: number;
    expiredInvitations: number;
    cancelledInvitations: number;
    averageResponseTime: number;
    conversionRate: number;
  };
  recentActivity: Array<{
    id: string;
    type:
      | "member_joined"
      | "member_suspended"
      | "member_activated"
      | "member_deleted"
      | "invitation_sent";
    description: string;
    timestamp: Date;
    userId?: string;
    targetUserId?: string;
  }>;
}

// GET /api/team/analytics - Get comprehensive team analytics
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y
    const includeActivity = searchParams.get("includeActivity") === "true";

    // Calculate date range
    const now = new Date();
    const from = new Date();
    switch (period) {
      case "7d":
        from.setDate(now.getDate() - 7);
        break;
      case "30d":
        from.setDate(now.getDate() - 30);
        break;
      case "90d":
        from.setDate(now.getDate() - 90);
        break;
      case "1y":
        from.setFullYear(now.getFullYear() - 1);
        break;
      default:
        from.setDate(now.getDate() - 30);
    }

    // Try to get from cache first
    const cache = InvitationAnalyticsCache.getInstance();
    const cacheKey = `team_analytics:${period}:${includeActivity}`;
    const cachedData = await cache.get<TeamAnalytics>(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Calculate overview metrics
    const overviewMetrics = await calculateOverviewMetrics(from, now);

    // Calculate role distribution
    const roleDistribution = await calculateRoleDistribution();

    // Calculate activity trends
    const activityTrends = await calculateActivityTrends(from, now);

    // Calculate invitation metrics
    const invitationMetrics = await calculateInvitationMetrics(from, now);

    // Calculate recent activity if requested
    let recentActivity: TeamAnalytics["recentActivity"] = [];
    if (includeActivity) {
      recentActivity = await calculateRecentActivity(from, now);
    }

    const analytics: TeamAnalytics = {
      overview: overviewMetrics,
      roleDistribution,
      activityTrends,
      invitationMetrics,
      recentActivity,
    };

    // Cache the results
    await cache.set(cacheKey, {}, analytics);

    // Audit log the access
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "team_analytics_viewed",
      metadata: JSON.stringify({
        period,
        includeActivity,
        resultCount: analytics.overview.totalMembers,
      }),
      ipAddress: request.headers.get("x-forwarded-for") || null,
      createdAt: new Date(),
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Team analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function calculateOverviewMetrics(_from: Date, _to: Date) {
  // Get total members
  const totalResult = await db.select({ count: count() }).from(user);

  // Get status breakdown
  const statusBreakdown = await db
    .select({
      status: user.status,
      count: count(),
    })
    .from(user)
    .groupBy(user.status);

  const totalMembers = Number(totalResult[0]?.count || 0);
  const activeMembers = Number(
    statusBreakdown.find((s) => s.status === "active")?.count || 0,
  );
  const suspendedMembers = Number(
    statusBreakdown.find((s) => s.status === "suspended")?.count || 0,
  );
  const pendingMembers = Number(
    statusBreakdown.find((s) => s.status === "pending")?.count || 0,
  );

  // Calculate conversion rate (active / (active + pending))
  const conversionRate =
    activeMembers + suspendedMembers > 0
      ? (activeMembers / (activeMembers + suspendedMembers + pendingMembers)) *
        100
      : 0;

  return {
    totalMembers,
    activeMembers,
    suspendedMembers,
    pendingMembers,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

async function calculateRoleDistribution() {
  const roleStats = await db
    .select({
      role: user.role,
      count: count(),
    })
    .from(user)
    .groupBy(user.role);

  const totalMembers = roleStats.reduce(
    (sum, stat) => sum + Number(stat.count),
    0,
  );

  return roleStats.map((stat) => ({
    role: stat.role,
    count: Number(stat.count),
    percentage:
      totalMembers > 0
        ? Math.round((Number(stat.count) / totalMembers) * 100 * 100) / 100
        : 0,
  }));
}

async function calculateActivityTrends(from: Date, to: Date) {
  // Get daily activity for the period
  const dailyActivity = await db
    .select({
      date: sql<string>`date(${user.createdAt})`,
      newMembers: sql<number>`count(case when ${user.status} != 'pending' then 1 end)`,
      activeMembers: sql<number>`count(case when ${user.status} = 'active' then 1 end)`,
      suspendedMembers: sql<number>`count(case when ${user.status} = 'suspended' then 1 end)`,
    })
    .from(user)
    .where(and(gte(user.createdAt, from), lte(user.createdAt, to)))
    .groupBy(sql`date(${user.createdAt})`)
    .orderBy(sql`date(${user.createdAt})`);

  return dailyActivity.map((day) => ({
    date: day.date,
    newMembers: Number(day.newMembers || 0),
    activeMembers: Number(day.activeMembers || 0),
    suspendedMembers: Number(day.suspendedMembers || 0),
  }));
}

async function calculateInvitationMetrics(from: Date, to: Date) {
  // This would integrate with invitation system
  // For now, return basic metrics based on user data
  const totalUsers = await db
    .select({ count: count() })
    .from(user)
    .where(and(gte(user.createdAt, from), lte(user.createdAt, to)));

  const activeUsers = await db
    .select({ count: count() })
    .from(user)
    .where(
      and(
        eq(user.status, "active"),
        gte(user.createdAt, from),
        lte(user.createdAt, to),
      ),
    );

  const pendingUsers = await db
    .select({ count: count() })
    .from(user)
    .where(
      and(
        eq(user.status, "pending"),
        gte(user.createdAt, from),
        lte(user.createdAt, to),
      ),
    );

  const totalInvitations = Number(totalUsers[0]?.count || 0);
  const acceptedInvitations = Number(activeUsers[0]?.count || 0);
  const pendingInvitations = Number(pendingUsers[0]?.count || 0);

  // Calculate conversion rate
  const conversionRate =
    totalInvitations > 0 ? (acceptedInvitations / totalInvitations) * 100 : 0;

  return {
    totalInvitations,
    acceptedInvitations,
    pendingInvitations,
    expiredInvitations: 0, // Would come from invitation table
    cancelledInvitations: 0, // Would come from invitation table
    averageResponseTime: 0, // Would come from invitation table
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

async function calculateRecentActivity(
  from: Date,
  to: Date,
): Promise<TeamAnalytics["recentActivity"]> {
  // Get recent audit logs related to team management
  const recentLogs = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
      userId: auditLog.userId,
      targetUserId: auditLog.targetUserId,
    })
    .from(auditLog)
    .where(
      and(
        gte(auditLog.createdAt, from),
        lte(auditLog.createdAt, to),
        sql`${auditLog.action} LIKE 'team_%'`,
      ),
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(50);

  return recentLogs.map((log) => {
    let type: TeamAnalytics["recentActivity"][0]["type"] = "member_joined";
    let description = "";

    switch (log.action) {
      case "team_member_invited":
        type = "invitation_sent";
        description = "New invitation sent";
        break;
      case "team_member_bulk_suspend":
        type = "member_suspended";
        description = "Member suspended";
        break;
      case "team_member_bulk_activate":
        type = "member_activated";
        description = "Member activated";
        break;
      case "team_member_bulk_delete":
        type = "member_deleted";
        description = "Member deleted";
        break;
      default:
        description = log.action.replace("team_", "").replace("_", " ");
    }

    return {
      id: log.id,
      type,
      description,
      timestamp: log.createdAt,
      userId: log.userId || undefined,
      targetUserId: log.targetUserId || undefined,
    };
  });
}
