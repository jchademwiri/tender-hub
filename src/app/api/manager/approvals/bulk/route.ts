import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/auth-utils";
import { withErrorHandling } from "@/lib/api-error-handler";

/**
 * Bulk approval operations endpoint
 * This endpoint is handled by the main approvals route when bulk=true is passed
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate and authorize manager user
  await requireManager();

    const body = await request.json();
    
    // Add bulk flag and forward to main approvals endpoint
    const bulkBody = { ...body, bulk: true };
    
    // Create a new request with the bulk body
    const bulkRequest = new NextRequest(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(bulkBody),
    });

    // Import and call the main POST handler
    const { POST: mainHandler } = await import("../route");
  return await mainHandler(bulkRequest);
});