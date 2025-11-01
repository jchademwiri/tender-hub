import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { profileUpdateRequest, user } from "@/db/schema";
import { getCurrentUser, requireManager } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email";
import { AuditLogger } from "@/lib/audit-logger";
import { 
  withErrorHandling, 
  createPaginatedResponse, 
  createSuccessResponse,
  handleValidationError,
  handleNotFoundError,
  ApiErrorType,
  createErrorResponse
} from "@/lib/api-error-handler";
import {
  approvalQuerySchema,
  approvalRequestSchema,
  bulkApprovalRequestSchema,
  validateRequestBody,
  validateQueryParams,
  type ApprovalQuery,
  type ApprovalRequest,
  type BulkApprovalRequest
} from "@/lib/api-validation-schemas";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate and authorize manager user
  const currentUser = await requireManager();

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const queryValidation = validateQueryParams(approvalQuerySchema)(queryParams);
    if (!queryValidation.success) {
      return handleValidationError(queryValidation.error);
    }

    const { page, limit, status, sortBy, sortOrder, search } = queryValidation.data;

    // Build where conditions
    const conditions = [];
    
    // Apply status filtering
    if (status !== "all") {
      conditions.push(eq(profileUpdateRequest.status, status));
    }

    // Apply search filtering
    if (search) {
      conditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      );
    }

    // Apply sorting
    const sortColumn = sortBy === "userName" ? user.name : 
                      sortBy === "userEmail" ? user.email :
                      profileUpdateRequest.requestedAt;

    // Execute queries with proper query building
    const offset = (page - 1) * limit;
    
    // Build main query
    const mainQueryBase = db
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
      })
      .from(profileUpdateRequest)
      .leftJoin(user, eq(profileUpdateRequest.userId, user.id));

    // Build count query
    const countQueryBase = db
      .select({ count: count() })
      .from(profileUpdateRequest)
      .leftJoin(user, eq(profileUpdateRequest.userId, user.id));

    // Execute queries based on conditions
    let approvals, totalResult;
    
    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      if (sortOrder === "asc") {
        approvals = await mainQueryBase
          .where(whereCondition)
          .orderBy(sortColumn)
          .limit(limit)
          .offset(offset);
      } else {
        approvals = await mainQueryBase
          .where(whereCondition)
          .orderBy(desc(sortColumn))
          .limit(limit)
          .offset(offset);
      }
      
      totalResult = await countQueryBase.where(whereCondition);
    } else {
      if (sortOrder === "asc") {
        approvals = await mainQueryBase
          .orderBy(sortColumn)
          .limit(limit)
          .offset(offset);
      } else {
        approvals = await mainQueryBase
          .orderBy(desc(sortColumn))
          .limit(limit)
          .offset(offset);
      }
      
      totalResult = await countQueryBase;
    }

    const total = totalResult[0]?.count || 0;

    // Log audit event
    await AuditLogger.logSystemAccess(currentUser.id, "manager_approvals_list", {
      userId: currentUser.id,
      metadata: {
        page,
        limit,
        status,
        search,
        resultCount: approvals.length,
        totalCount: total
      }
    });

  return createPaginatedResponse(
    approvals,
    {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    },
    `Retrieved ${approvals.length} approval requests`
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate and authorize manager user
  const currentUser = await requireManager();

  const body = await request.json();
  
  // Check if this is a bulk operation
  if (body.bulk === true) {
    return handleBulkApprovalOperation(currentUser, body);
  }

  // Validate request body
  const bodyValidation = validateRequestBody(approvalRequestSchema)(body);
  if (!bodyValidation.success) {
    return handleValidationError(bodyValidation.error);
  }

  const { approvalId, action, reason, notifyUser } = bodyValidation.data;

    // Get the approval request with user details
    const approval = await db
      .select({
        id: profileUpdateRequest.id,
        userId: profileUpdateRequest.userId,
        requestedChanges: profileUpdateRequest.requestedChanges,
        status: profileUpdateRequest.status,
        requestedAt: profileUpdateRequest.requestedAt,
        // Join with user table to get requester details
        userEmail: user.email,
        userName: user.name,
      })
      .from(profileUpdateRequest)
      .leftJoin(user, eq(profileUpdateRequest.userId, user.id))
      .where(eq(profileUpdateRequest.id, approvalId))
      .limit(1);

    if (approval.length === 0) {
      return handleNotFoundError("Approval request");
    }

    const approvalRequest = approval[0];

    if (approvalRequest.status !== "pending") {
      return createErrorResponse(
        ApiErrorType.CONFLICT_ERROR,
        "Approval request has already been processed"
      );
    }

    // Check if manager has permission to approve this request
    // For now, allow all managers to approve any request
    // TODO: Add more sophisticated permission logic based on team/department

    if (action === "approve") {
      // Apply the profile changes to the user
      const changes = approvalRequest.requestedChanges as Record<string, any>;

      // Update user record with approved changes
      await db
        .update(user)
        .set({
          ...changes,
          updatedAt: new Date(),
        })
        .where(eq(user.id, approvalRequest.userId));

      // Update approval request status
      await db
        .update(profileUpdateRequest)
        .set({
          status: "approved",
          reviewedBy: currentUser.id,
          reviewedAt: new Date(),
        })
        .where(eq(profileUpdateRequest.id, approvalId));

      // Send notification email
      if (approvalRequest.userEmail) {
        await sendApprovalNotificationEmail(
          approvalRequest.userEmail,
          approvalRequest.userName || "User",
          "approved",
          currentUser.name,
          changes
        );
      }

      // Audit log the approval
      await AuditLogger.logProfileUpdateApproved(
        approvalRequest.userId,
        approvalId,
        currentUser.id,
        {
          userId: currentUser.id,
          metadata: {
            approvedChanges: changes,
            approverName: currentUser.name,
            approverEmail: currentUser.email,
          },
        }
      );

      return createSuccessResponse({
        approvalId,
        status: "approved",
        approvedChanges: changes,
        approvedBy: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
        },
        approvedAt: new Date().toISOString()
      }, "Profile update approved successfully");
    } else if (action === "reject") {
      // Validate rejection reason if required
      if (!reason || reason.trim() === "") {
        return createErrorResponse(
          ApiErrorType.VALIDATION_ERROR,
          "Rejection reason is required"
        );
      }

      // Update approval request status
      await db
        .update(profileUpdateRequest)
        .set({
          status: "rejected",
          reviewedBy: currentUser.id,
          reviewedAt: new Date(),
          rejectionReason: reason.trim(),
        })
        .where(eq(profileUpdateRequest.id, approvalId));

      // Send notification email
      if (approvalRequest.userEmail) {
        await sendApprovalNotificationEmail(
          approvalRequest.userEmail,
          approvalRequest.userName || "User",
          "rejected",
          currentUser.name,
          undefined,
          reason
        );
      }

      // Audit log the rejection
      await AuditLogger.logProfileUpdateRejected(
        approvalRequest.userId,
        approvalId,
        currentUser.id,
        reason || "No reason provided",
        {
          userId: currentUser.id,
          metadata: {
            rejectedByName: currentUser.name,
            rejectedByEmail: currentUser.email,
            rejectionReason: reason || "No reason provided",
          },
        }
      );

      return createSuccessResponse({
        approvalId,
        status: "rejected",
        rejectedBy: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
        },
        reason,
        rejectedAt: new Date().toISOString()
      }, "Profile update rejected");
    }

    // This should never be reached
    return createErrorResponse(
      ApiErrorType.BAD_REQUEST_ERROR,
      "Invalid action"
    );
});

/**
 * Handle bulk approval operations
 */
async function handleBulkApprovalOperation(currentUser: any, body: any) {
  const validation = validateRequestBody(bulkApprovalRequestSchema)(body);
  if (!validation.success) {
    return handleValidationError(validation.error);
  }

  const { action, approvalIds, reason, notifyUsers } = validation.data;

  // Validate rejection reason for bulk reject
  if (action === "reject" && (!reason || reason.trim() === "")) {
    return createErrorResponse(
      ApiErrorType.VALIDATION_ERROR,
      "Rejection reason is required for bulk reject operations"
    );
  }

  try {
    // Get all approval requests with user details
    const approvals = await db
      .select({
        id: profileUpdateRequest.id,
        userId: profileUpdateRequest.userId,
        requestedChanges: profileUpdateRequest.requestedChanges,
        status: profileUpdateRequest.status,
        requestedAt: profileUpdateRequest.requestedAt,
        userEmail: user.email,
        userName: user.name,
      })
      .from(profileUpdateRequest)
      .leftJoin(user, eq(profileUpdateRequest.userId, user.id))
      .where(
        and(
          eq(profileUpdateRequest.status, "pending"),
          // Use 'in' operator equivalent for multiple IDs
          or(...approvalIds.map(id => eq(profileUpdateRequest.id, id)))
        )
      );

    if (approvals.length === 0) {
      return handleNotFoundError("No pending approval requests found for the provided IDs");
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
      processed: 0,
      total: approvals.length
    };

    // Process each approval
    for (const approval of approvals) {
      try {
        if (action === "approve") {
          // Apply the profile changes to the user
          const changes = approval.requestedChanges as Record<string, any>;

          // Update user record with approved changes
          await db
            .update(user)
            .set({
              ...changes,
              updatedAt: new Date(),
            })
            .where(eq(user.id, approval.userId));

          // Update approval request status
          await db
            .update(profileUpdateRequest)
            .set({
              status: "approved",
              reviewedBy: currentUser.id,
              reviewedAt: new Date(),
            })
            .where(eq(profileUpdateRequest.id, approval.id));

          // Send notification email if requested
          if (notifyUsers && approval.userEmail) {
            await sendApprovalNotificationEmail(
              approval.userEmail,
              approval.userName || "User",
              "approved",
              currentUser.name,
              changes
            );
          }

          // Audit log the approval
          await AuditLogger.logProfileUpdateApproved(
            approval.userId,
            approval.id,
            currentUser.id,
            {
              userId: currentUser.id,
              metadata: {
                approvedChanges: changes,
                approverName: currentUser.name,
                approverEmail: currentUser.email,
                bulkOperation: true
              },
            }
          );

          results.successful.push(approval.id);
        } else if (action === "reject") {
          // Update approval request status
          await db
            .update(profileUpdateRequest)
            .set({
              status: "rejected",
              reviewedBy: currentUser.id,
              reviewedAt: new Date(),
              rejectionReason: reason?.trim(),
            })
            .where(eq(profileUpdateRequest.id, approval.id));

          // Send notification email if requested
          if (notifyUsers && approval.userEmail) {
            await sendApprovalNotificationEmail(
              approval.userEmail,
              approval.userName || "User",
              "rejected",
              currentUser.name,
              undefined,
              reason
            );
          }

          // Audit log the rejection
          await AuditLogger.logProfileUpdateRejected(
            approval.userId,
            approval.id,
            currentUser.id,
            reason || "No reason provided",
            {
              userId: currentUser.id,
              metadata: {
                rejectedByName: currentUser.name,
                rejectedByEmail: currentUser.email,
                rejectionReason: reason || "No reason provided",
                bulkOperation: true
              },
            }
          );

          results.successful.push(approval.id);
        }

        results.processed++;
      } catch (error) {
        console.error(`Failed to process approval ${approval.id}:`, error);
        results.failed.push({
          id: approval.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Log bulk operation audit event
    await AuditLogger.logSystemAccess(currentUser.id, `bulk_approval_${action}`, {
      userId: currentUser.id,
      metadata: {
        action,
        totalRequests: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        reason: action === "reject" ? reason : undefined
      }
    });

    return createSuccessResponse({
      results,
      summary: {
        action,
        processed: results.processed,
        successful: results.successful.length,
        failed: results.failed.length,
        total: results.total
      }
    }, `Bulk ${action} operation completed`);

  } catch (error) {
    console.error("Bulk approval operation error:", error);
    
    // Log error for audit
    await AuditLogger.logSystemAccess(currentUser.id, `bulk_approval_${action}_error`, {
      userId: currentUser.id,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        approvalIds
      }
    });

    throw error; // Let withErrorHandling wrapper handle this
  }
}

/**
 * Send approval notification email to user
 */
async function sendApprovalNotificationEmail(
  userEmail: string,
  userName: string,
  action: "approved" | "rejected",
  managerName: string,
  changes?: Record<string, any>,
  reason?: string
) {
  try {
    const subject = action === "approved" 
      ? "Profile Update Approved - Tender Hub"
      : "Profile Update Rejected - Tender Hub";

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Profile Update ${action === "approved" ? "Approved" : "Rejected"}</h2>
        <p>Hello ${userName},</p>
        <p>Your profile update request has been <strong>${action}</strong> by ${managerName}.</p>
    `;

    if (action === "approved" && changes) {
      html += `
        <h3>Approved Changes:</h3>
        <ul>
      `;
      for (const [key, value] of Object.entries(changes)) {
        html += `<li><strong>${key}:</strong> ${value}</li>`;
      }
      html += `</ul>`;
    }

    if (action === "rejected" && reason) {
      html += `
        <h3>Reason for Rejection:</h3>
        <p style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #dc3545;">
          ${reason}
        </p>
        <p>You can update your profile and submit a new request if needed.</p>
      `;
    }

    html += `
        <p>If you have any questions, please contact your manager or administrator.</p>
        <p>Best regards,<br>The Tender Hub Team</p>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject,
      html
    });
  } catch (error) {
    console.error("Failed to send approval notification email:", error);
    // Don't throw error - email failure shouldn't fail the approval process
  }
}
