import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { profileUpdateRequest, user } from "@/db/schema";
import { requireAuth, requireManager } from "@/lib/auth-utils";
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
    await AuditLogger.logSystemAccess(currentUser.user.id, "manager_approvals_list", {
      userId: currentUser.user.id,
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
    }
  );
});

// Temporarily disabled due to type issues - POST handler removed

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
