import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { profileUpdateRequest, user } from "@/db/schema";
import { requireManager } from "@/lib/auth-utils";
import { AuditLogger } from "@/lib/audit-logger";
import { 
  withErrorHandling, 
  createSuccessResponse, 
  handleValidationError,
  handleNotFoundError,
  ApiErrorType,
  createErrorResponse
} from "@/lib/api-error-handler";
import {
  uuidSchema,
  approvalRequestSchema,
  validateRequestBody,
  type ApprovalRequest
} from "@/lib/api-validation-schemas";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Authenticate and authorize manager user
  const currentUser = await requireManager();

    const { id } = params;

    // Validate UUID format
    const validation = uuidSchema.safeParse(id);
    
    if (!validation.success) {
      return createErrorResponse(
        ApiErrorType.VALIDATION_ERROR,
        "Invalid approval ID format"
      );
    }

    // Get approval request with user details
    const approval = await db
      .select({
        id: profileUpdateRequest.id,
        userId: profileUpdateRequest.userId,
        requestedChanges: profileUpdateRequest.requestedChanges,
        status: profileUpdateRequest.status,
        requestedAt: profileUpdateRequest.requestedAt,
        reviewedBy: profileUpdateRequest.reviewedBy,
        reviewedAt: profileUpdateRequest.reviewedAt,
        rejectionReason: profileUpdateRequest.rejectionReason,
        // User details
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        userStatus: user.status,
        userCreatedAt: user.createdAt,
      })
      .from(profileUpdateRequest)
      .leftJoin(user, eq(profileUpdateRequest.userId, user.id))
      .where(eq(profileUpdateRequest.id, id))
      .limit(1);

    if (approval.length === 0) {
      return handleNotFoundError("Approval request");
    }

    const approvalData = approval[0];

    // Get reviewer details if reviewed
    let reviewerDetails = null;
    if (approvalData.reviewedBy) {
      const reviewer = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        })
        .from(user)
        .where(eq(user.id, approvalData.reviewedBy))
        .limit(1);
      
      reviewerDetails = reviewer[0] || null;
    }

    // Format the response
    const response = {
      id: approvalData.id,
      status: approvalData.status,
      requestedAt: approvalData.requestedAt,
      reviewedAt: approvalData.reviewedAt,
      rejectionReason: approvalData.rejectionReason,
      requestedChanges: approvalData.requestedChanges,
      user: {
        id: approvalData.userId,
        name: approvalData.userName,
        email: approvalData.userEmail,
        role: approvalData.userRole,
        status: approvalData.userStatus,
        createdAt: approvalData.userCreatedAt
      },
      reviewer: reviewerDetails
    };

    // Log audit event
    await AuditLogger.logSystemAccess(currentUser.id, "manager_approval_details", {
      userId: currentUser.id,
      metadata: {
        approvalId: id,
        approvalStatus: approvalData.status
      }
    });

  return createSuccessResponse(response, "Approval request details retrieved successfully");
});

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Authenticate and authorize manager user
  const currentUser = await requireManager();

    const { id } = params;
    const body = await request.json();

    // Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    
    if (!idValidation.success) {
      return createErrorResponse(
        ApiErrorType.VALIDATION_ERROR,
        "Invalid approval ID format"
      );
    }

    // Validate request body
    const bodyValidation = validateRequestBody(approvalRequestSchema)(body);
    if (!bodyValidation.success) {
      return handleValidationError(bodyValidation.error);
    }

    const { action, reason, notifyUser } = bodyValidation.data;

    // Validate rejection reason
    if (action === "reject" && (!reason || reason.trim() === "")) {
      return createErrorResponse(
        ApiErrorType.VALIDATION_ERROR,
        "Rejection reason is required"
      );
    }

    // Forward to main approvals endpoint
    const forwardBody = {
      approvalId: id,
      action,
      reason,
      notifyUser
    };

    const forwardRequest = new NextRequest(request.url.replace(`/${id}`, ''), {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(forwardBody),
    });

    // Import and call the main POST handler
    const { POST: mainHandler } = await import("../route");
  return await mainHandler(forwardRequest);
});