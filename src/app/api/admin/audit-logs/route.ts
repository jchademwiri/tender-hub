import { subDays } from "date-fns";
import { desc, eq, gte, count } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "all";
    const days = parseInt(searchParams.get("days") || "30", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);

    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedPageSize = Math.min(Math.max(1, pageSize), 100); // Max 100 items per page
    const offset = (validatedPage - 1) * validatedPageSize;

    // Calculate date filter
    const fromDate = subDays(new Date(), days);

    // Get audit logs (get more than needed since we'll filter after)
    const auditLogsData = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        targetUserId: auditLog.targetUserId,
        userId: auditLog.userId,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(gte(auditLog.createdAt, fromDate))
      .orderBy(desc(auditLog.createdAt))
      .limit(1000); // Get more data to filter from

    // Get unique user IDs for lookup (excluding anonymous and null values)
    const userIds = [
      ...new Set(
        auditLogsData
          .filter((log) => log.userId && log.userId !== "anonymous")
          .map((log) => log.userId)
          .filter(Boolean), // Remove undefined/null values
      ),
    ];

    // Create a map of user IDs to user names and roles
    const userNameMap = new Map<string, string>();
    const userRoleMap = new Map<string, string>();

    // Fetch users one by one to avoid complex queries
    for (const userId of userIds.slice(0, 20)) {
      // Limit to first 20 for performance
      if (!userId) continue; // Skip null/undefined user IDs

      try {
        const [userData] = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          })
          .from(user)
          .where(eq(user.id, userId as string))
          .limit(1);

        if (userData?.id) {
          userNameMap.set(userData.id, userData.name);
          userRoleMap.set(userData.id, userData.role);
        }
      } catch (error) {
        console.warn(`Failed to fetch user ${userId}:`, error);
      }
    }

    // Enrich audit logs with user information
    const enrichedAuditLogs = auditLogsData.map((log) => {
      let userName = "Unknown User";
      let userEmail = null;
      let userRole = "User";

      if (log.userId === "anonymous") {
        userName = "Anonymous";
        userRole = "System";
      } else if (log.userId) {
        // First try to get from our user lookup
        const lookupName = userNameMap.get(log.userId);
        const lookupRole = userRoleMap.get(log.userId);

        if (lookupName) {
          userName = lookupName;
        } else {
          // Try to extract user info from metadata
          try {
            const meta =
              typeof log.metadata === "string"
                ? JSON.parse(log.metadata)
                : log.metadata;
            if (meta?.email) {
              userName = meta.email;
              userEmail = meta.email;
            } else {
              // Fallback to shortened ID
              userName = `${log.userId.substring(0, 8)}...`;
            }
          } catch (_e) {
            // If metadata parsing fails, use short ID
            userName = `${log.userId.substring(0, 8)}...`;
          }
        }

        if (lookupRole) {
          userRole = lookupRole;
        }
      }

      return {
        ...log,
        userName,
        userEmail,
        userRole,
      };
    });

    // Filter by action if specified
    const filteredLogs =
      action !== "all"
        ? enrichedAuditLogs.filter((log) => log.action === action)
        : enrichedAuditLogs;

    // Calculate pagination info
    const totalPages = Math.ceil(filteredLogs.length / validatedPageSize);
    const startIndex = offset;
    const endIndex = Math.min(startIndex + validatedPageSize, filteredLogs.length);
    const currentPageData = filteredLogs.slice(startIndex, endIndex);

    return NextResponse.json({
      auditLogs: currentPageData,
      pagination: {
        page: validatedPage,
        pageSize: validatedPageSize,
        total: filteredLogs.length,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
        startIndex,
        endIndex,
      },
      filters: {
        action,
        days,
        fromDate,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
