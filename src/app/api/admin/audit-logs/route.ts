import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { desc, gte } from "drizzle-orm";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const currentUser = await requireAuth();
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "all";
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date filter
    const fromDate = subDays(new Date(), days);

    // Build query
    let query = db
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
      .limit(100);

    // Get audit logs
    const auditLogs = await query;

    // Filter by action if specified (client-side filtering for now)
    const filteredLogs = action !== "all" 
      ? auditLogs.filter(log => log.action === action)
      : auditLogs;

    return NextResponse.json({
      auditLogs: filteredLogs,
      total: filteredLogs.length,
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
      { status: 500 }
    );
  }
}