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
  createErrorResponse,
  APIErrors
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
      throw APIErrors.validation("Invalid approval ID format");
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
      throw APIErrors.notFound("Approval request not found");
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
    await AuditLogger.logSystemAccess(currentUser.user.id, "manager_approval_details", {
      userId: currentUser.user.id,
      metadata: {
        approvalId: id,
        approvalStatus: approvalData.status
      }
    });

  return createSuccessResponse(response);
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
      throw APIErrors.validation("Invalid approval ID format");
    }

    // Validate request body
    const bodyValidation = approvalRequestSchema.safeParse(body);
    if (!bodyValidation.success) {
      throw APIErrors.validation("Invalid request body", bodyValidation.error.issues);
    }

    const { action, reason, notifyUser } = bodyValidation.data;

    // Validate rejection reason
    if (action === "reject" && (!reason || reason.trim() === "")) {
      throw APIErrors.validation("Rejection reason is required");
    }

    // Process the approval directly
    const result = await db
      .update(profileUpdateRequest)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        reviewedBy: currentUser.user.id,
        reviewedAt: new Date(),
        rejectionReason: action === "reject" ? reason : null,
      })
      .where(eq(profileUpdateRequest.id, id))
      .returning();

    if (result.length === 0) {
      throw APIErrors.notFound("Approval request not found");
    }

    // Log audit event
    await AuditLogger.logSystemAccess(currentUser.user.id, `approval_${action}`, {
      userId: currentUser.user.id,
      metadata: {
        approvalId: id,
        action,
        reason: reason || null,
        notifyUser,
      }
    });

    return createSuccessResponse({
      id,
      action,
      status: action === "approve" ? "approved" : "rejected",
      reviewedAt: new Date(),
      reviewedBy: currentUser.user.id,
    });
});