import { count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profileUpdateRequest } from "@/db/schema";
import { requireManager } from "@/lib/auth-utils";
import { withErrorHandling, createSuccessResponse } from "@/lib/api-error-handler";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate and authorize manager user
  await requireManager();

    // Get count of pending approvals
    const result = await db
      .select({ count: count() })
      .from(profileUpdateRequest)
      .where(eq(profileUpdateRequest.status, "pending"));

    const pendingCount = result[0]?.count || 0;

  return createSuccessResponse({
    pendingCount,
    timestamp: new Date().toISOString()
  }, "Pending approval count retrieved successfully");
});