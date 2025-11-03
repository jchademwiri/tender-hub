import { count, eq, and, gte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profileUpdateRequest, user } from "@/db/schema";
import { requireManager } from "@/lib/auth-utils";
import { AuditLogger } from "@/lib/audit-logger";
import { withErrorHandling, createSuccessResponse, handleValidationError } from "@/lib/api-error-handler";
import { 
  approvalStatsQuerySchema, 
  validateQueryParams,
  type ApprovalStatsQuery 
} from "@/lib/api-validation-schemas";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate and authorize manager user
  const currentUser = await requireManager();

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const queryValidation = validateQueryParams(approvalStatsQuerySchema)(queryParams);
    if (!queryValidation.success) {
      return handleValidationError(queryValidation.error);
    }

    const { period: periodDays } = queryValidation.data;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get approval statistics
    const [
      totalPending,
      totalApproved,
      totalRejected,
      recentActivity,
      avgProcessingTime
    ] = await Promise.all([
      // Total pending approvals
      db
        .select({ count: count() })
        .from(profileUpdateRequest)
        .where(eq(profileUpdateRequest.status, "pending")),

      // Total approved in period
      db
        .select({ count: count() })
        .from(profileUpdateRequest)
        .where(
          and(
            eq(profileUpdateRequest.status, "approved"),
            gte(profileUpdateRequest.reviewedAt, startDate)
          )
        ),

      // Total rejected in period
      db
        .select({ count: count() })
        .from(profileUpdateRequest)
        .where(
          and(
            eq(profileUpdateRequest.status, "rejected"),
            gte(profileUpdateRequest.reviewedAt, startDate)
          )
        ),

      // Recent activity (last 7 days)
      db
        .select({
          date: sql<string>`DATE(${profileUpdateRequest.reviewedAt})`,
          approved: sql<number>`COUNT(CASE WHEN ${profileUpdateRequest.status} = 'approved' THEN 1 END)`,
          rejected: sql<number>`COUNT(CASE WHEN ${profileUpdateRequest.status} = 'rejected' THEN 1 END)`
        })
        .from(profileUpdateRequest)
        .where(
          and(
            gte(profileUpdateRequest.reviewedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
            sql`${profileUpdateRequest.status} IN ('approved', 'rejected')`
          )
        )
        .groupBy(sql`DATE(${profileUpdateRequest.reviewedAt})`)
        .orderBy(sql`DATE(${profileUpdateRequest.reviewedAt}) DESC`),

      // Average processing time (in hours)
      db
        .select({
          avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${profileUpdateRequest.reviewedAt} - ${profileUpdateRequest.requestedAt})) / 3600)`
        })
        .from(profileUpdateRequest)
        .where(
          and(
            sql`${profileUpdateRequest.status} IN ('approved', 'rejected')`,
            gte(profileUpdateRequest.reviewedAt, startDate)
          )
        )
    ]);

    // Get top requesters (users with most requests in period)
    const topRequesters = await db
      .select({
        userId: profileUpdateRequest.userId,
        userName: user.name,
        userEmail: user.email,
        requestCount: count(),
        approvedCount: sql<number>`COUNT(CASE WHEN ${profileUpdateRequest.status} = 'approved' THEN 1 END)`,
        rejectedCount: sql<number>`COUNT(CASE WHEN ${profileUpdateRequest.status} = 'rejected' THEN 1 END)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${profileUpdateRequest.status} = 'pending' THEN 1 END)`
      })
      .from(profileUpdateRequest)
      .leftJoin(user, eq(profileUpdateRequest.userId, user.id))
      .where(gte(profileUpdateRequest.requestedAt, startDate))
      .groupBy(profileUpdateRequest.userId, user.name, user.email)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    const stats = {
      summary: {
        pending: totalPending[0]?.count || 0,
        approved: totalApproved[0]?.count || 0,
        rejected: totalRejected[0]?.count || 0,
        total: (totalApproved[0]?.count || 0) + (totalRejected[0]?.count || 0),
        avgProcessingTimeHours: Math.round((avgProcessingTime[0]?.avgHours || 0) * 10) / 10
      },
      period: {
        days: periodDays,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      recentActivity: recentActivity.map(activity => ({
        date: activity.date,
        approved: Number(activity.approved),
        rejected: Number(activity.rejected),
        total: Number(activity.approved) + Number(activity.rejected)
      })),
      topRequesters: topRequesters.map(requester => ({
        userId: requester.userId,
        userName: requester.userName,
        userEmail: requester.userEmail,
        requests: {
          total: Number(requester.requestCount),
          approved: Number(requester.approvedCount),
          rejected: Number(requester.rejectedCount),
          pending: Number(requester.pendingCount)
        },
        approvalRate: requester.requestCount > 0 
          ? Math.round((Number(requester.approvedCount) / Number(requester.requestCount)) * 100)
          : 0
      }))
    };

    // Log audit event
    await AuditLogger.logSystemAccess(currentUser.user.id, "manager_approval_stats", {
      userId: currentUser.user.id,
      metadata: {
        period: periodDays,
        statsGenerated: true
      }
    });

  return createSuccessResponse(stats);
});