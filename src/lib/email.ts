import AccountDeletionEmail from "@emails/account-deletion";
import ApprovalDecisionEmail from "@emails/approval-decision";
import EmailVerificationEmail from "@emails/email-verification";
import InvitationEmail from "@emails/invitation";
import PasswordChangedEmail from "@emails/password-changed";
import PasswordResetEmail from "@emails/password-reset";
import SystemMaintenanceEmail from "@emails/system-maintenance";
import UserStatusChangeEmail from "@emails/user-status-change";
import { render } from "@react-email/render";
import React from "react";
import { Resend } from "resend";
import { AuditLogger } from "@/lib/audit-logger";
import { canReceiveEmail, logEmailDelivery } from "@/lib/email-preferences";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email delivery retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

// Email delivery status tracking
export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount: number;
  deliveryTime: number;
}

// Retry logic with exponential backoff
async function retryEmailDelivery<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
      RETRY_CONFIG.maxDelay
    );

    console.warn(`Email delivery failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryEmailDelivery(operation, retryCount + 1);
  }
}

// Enhanced email sending with delivery tracking and preferences checking
async function sendEmailWithTracking(
  emailData: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  },
  emailType: string,
  userId?: string
): Promise<EmailDeliveryResult> {
  const startTime = Date.now();
  let retryCount = 0;

  try {
    // Check email preferences if userId is provided
    if (userId) {
      const canSend = await canReceiveEmail(userId, emailType as keyof import("@/lib/email-preferences").EmailPreferenceUpdate);
      if (!canSend) {
        // Log blocked email
        await logEmailDelivery({
          userId,
          recipient: emailData.to,
          emailType,
          subject: emailData.subject,
          status: "failed",
          errorMessage: "User has unsubscribed from this email type",
          deliveryTime: Date.now() - startTime,
          retryCount: 0,
        });

        return {
          success: false,
          error: "User has unsubscribed from this email type",
          retryCount: 0,
          deliveryTime: Date.now() - startTime,
        };
      }
    }

    const result = await retryEmailDelivery(async () => {
      retryCount++;
      return await resend.emails.send({
        from: emailData.from || process.env.RESEND_FROM_EMAIL || "Tender Hub <noreply@tenderhub.com>",
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
      });
    });

    const deliveryTime = Date.now() - startTime;

    // Log successful email delivery
    await Promise.all([
      AuditLogger.logSystemAccess(userId || "system", "email_service", {
        metadata: {
          action: "email_sent",
          emailType,
          recipient: emailData.to,
          subject: emailData.subject,
          messageId: result.data?.id,
          deliveryTime,
          retryCount: retryCount - 1,
          success: true,
        },
      }),
      logEmailDelivery({
        userId,
        recipient: emailData.to,
        emailType,
        subject: emailData.subject,
        messageId: result.data?.id,
        status: "sent",
        deliveryTime,
        retryCount: retryCount - 1,
      }),
    ]);

    return {
      success: true,
      messageId: result.data?.id,
      retryCount: retryCount - 1,
      deliveryTime,
    };

  } catch (error) {
    const deliveryTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failed email delivery
    await Promise.all([
      AuditLogger.logSystemAccess(userId || "system", "email_service", {
        metadata: {
          action: "email_failed",
          emailType,
          recipient: emailData.to,
          subject: emailData.subject,
          error: errorMessage,
          deliveryTime,
          retryCount: retryCount - 1,
          success: false,
        },
      }),
      logEmailDelivery({
        userId,
        recipient: emailData.to,
        emailType,
        subject: emailData.subject,
        status: "failed",
        errorMessage,
        deliveryTime,
        retryCount: retryCount - 1,
      }),
    ]);

    console.error("Failed to send email after retries:", error);
    
    return {
      success: false,
      error: errorMessage,
      retryCount: retryCount - 1,
      deliveryTime,
    };
  }
}

// Simple email component for HTML content
const SimpleEmailComponent = ({
  html,
  text,
}: {
  html?: string;
  text?: string;
}) => {
  if (html) {
    return React.createElement("div", {
      dangerouslySetInnerHTML: { __html: html },
    });
  }
  if (text) {
    return React.createElement("div", {}, text);
  }
  return React.createElement("div", {}, "No content");
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  userId,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  userId?: string;
}): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(SimpleEmailComponent, { html, text }),
  );

  return await sendEmailWithTracking(
    {
      to,
      subject,
      html: renderedHtml,
    },
    "generic",
    userId
  );
}

export async function sendPasswordResetEmail(to: string, url: string, userId?: string): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(PasswordResetEmail, {
      userEmail: to,
      resetUrl: url,
      expirationTime: "1 hour",
    }),
  );

  return await sendEmailWithTracking(
    {
      to,
      subject: "Reset Your Password - Tender Hub",
      html: renderedHtml,
    },
    "password_reset",
    userId
  );
}

export async function sendEmailVerification(to: string, url: string, userId?: string): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(EmailVerificationEmail, {
      userEmail: to,
      verificationUrl: url,
      expirationTime: "1 hour",
    }),
  );

  return await sendEmailWithTracking(
    {
      to,
      subject: "Verify Your Email - Tender Hub",
      html: renderedHtml,
    },
    "email_verification",
    userId
  );
}

export async function sendAccountDeletionEmail(to: string, url: string, userId?: string): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(AccountDeletionEmail, {
      userEmail: to,
      confirmationUrl: url,
      expirationTime: "24 hours",
    }),
  );

  return await sendEmailWithTracking(
    {
      to,
      subject: "Confirm Account Deletion - Tender Hub",
      html: renderedHtml,
    },
    "account_deletion",
    userId
  );
}

export async function sendPasswordChangedEmail(to: string, userId?: string): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(PasswordChangedEmail, {
      userEmail: to,
    }),
  );

  return await sendEmailWithTracking(
    {
      to,
      subject: "Password Changed - Tender Hub",
      html: renderedHtml,
    },
    "password_changed",
    userId
  );
}

export async function sendInvitationEmail({
  to,
  inviterName,
  inviterEmail,
  role,
  invitationUrl,
  expirationTime = "7 days",
  userId,
}: {
  to: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  invitationUrl: string;
  expirationTime?: string;
  userId?: string;
}): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(InvitationEmail, {
      inviteeEmail: to,
      inviterName,
      inviterEmail,
      role,
      invitationUrl,
      expirationTime,
    }),
  );

  return await sendEmailWithTracking(
    {
      to,
      subject: "You've been invited to join Tender Hub",
      html: renderedHtml,
    },
    "invitation",
    userId
  );
}

// Email service performance monitoring
export interface EmailPerformanceMetrics {
  totalSent: number;
  totalFailed: number;
  averageDeliveryTime: number;
  successRate: number;
  retryRate: number;
}

export async function getEmailPerformanceMetrics(): Promise<EmailPerformanceMetrics> {
  try {
    // This would typically query the audit logs for email metrics
    // For now, we'll return a basic implementation
    const defaultMetrics: EmailPerformanceMetrics = {
      totalSent: 0,
      totalFailed: 0,
      averageDeliveryTime: 0,
      successRate: 0,
      retryRate: 0,
    };

    // In a real implementation, you would query the audit logs:
    // const emailLogs = await auditLogger.getEmailMetrics(startDate, endDate);
    // return calculateMetrics(emailLogs);

    return defaultMetrics;
  } catch (error) {
    console.error("Failed to get email performance metrics:", error);
    throw new Error("Unable to retrieve email metrics");
  }
}

// Email service health status
export async function getEmailServiceStatus(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity to Resend
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: responseTime < 2000 ? "healthy" : "degraded",
        lastCheck: new Date(),
        responseTime,
      };
    } else {
      return {
        status: "unhealthy",
        lastCheck: new Date(),
        responseTime,
        error: `API returned ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: "unhealthy",
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// New notification email functions

export async function sendApprovalDecisionEmail({
  to,
  userName,
  managerName,
  managerEmail,
  requestType,
  decision,
  reason,
  conditions,
  dashboardUrl,
  userId,
}: {
  to: string;
  userName: string;
  managerName: string;
  managerEmail: string;
  requestType: string;
  decision: "approved" | "rejected";
  reason?: string;
  conditions?: string[];
  dashboardUrl?: string;
  userId?: string;
}): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(ApprovalDecisionEmail, {
      userEmail: to,
      userName,
      managerName,
      managerEmail,
      requestType,
      decision,
      reason,
      conditions,
      dashboardUrl,
      requestDate: new Date().toLocaleDateString("en-ZA"),
      decisionDate: new Date().toLocaleDateString("en-ZA"),
    }),
  );

  return await sendEmailWithTracking(
    {
      to,
      subject: `Request ${decision === "approved" ? "Approved" : "Rejected"} - ${requestType}`,
      html: renderedHtml,
    },
    "approval_decision",
    userId
  );
}

export async function sendSystemMaintenanceEmail({
  to,
  userName,
  maintenanceType,
  title,
  description,
  startTime,
  endTime,
  estimatedDuration,
  affectedServices,
  isUrgent,
  userId,
}: {
  to: string;
  userName: string;
  maintenanceType: "scheduled" | "emergency" | "completed";
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: string;
  affectedServices?: string[];
  isUrgent?: boolean;
  userId?: string;
}): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(SystemMaintenanceEmail, {
      userEmail: to,
      userName,
      maintenanceType,
      title,
      description,
      startTime,
      endTime,
      estimatedDuration,
      affectedServices,
      isUrgent,
    }),
  );

  const urgentPrefix = isUrgent ? "[URGENT] " : "";
  
  return await sendEmailWithTracking(
    {
      to,
      subject: `${urgentPrefix}${title} - Tender Hub`,
      html: renderedHtml,
    },
    "system_maintenance",
    userId
  );
}

export async function sendUserStatusChangeEmail({
  to,
  userName,
  adminName,
  adminEmail,
  statusChange,
  oldStatus,
  newStatus,
  oldRole,
  newRole,
  reason,
  isTemporary,
  reviewDate,
  userId,
}: {
  to: string;
  userName: string;
  adminName: string;
  adminEmail: string;
  statusChange: "activated" | "suspended" | "role_changed" | "permissions_updated";
  oldStatus?: string;
  newStatus?: string;
  oldRole?: string;
  newRole?: string;
  reason?: string;
  isTemporary?: boolean;
  reviewDate?: string;
  userId?: string;
}): Promise<EmailDeliveryResult> {
  const renderedHtml = await render(
    React.createElement(UserStatusChangeEmail, {
      userEmail: to,
      userName,
      adminName,
      adminEmail,
      statusChange,
      oldStatus,
      newStatus,
      oldRole,
      newRole,
      reason,
      effectiveDate: new Date().toLocaleDateString("en-ZA"),
      isTemporary,
      reviewDate,
    }),
  );

  const getSubjectTitle = () => {
    switch (statusChange) {
      case "activated":
        return "Account Activated";
      case "suspended":
        return "Account Suspended";
      case "role_changed":
        return "Role Updated";
      case "permissions_updated":
        return "Permissions Updated";
      default:
        return "Account Updated";
    }
  };

  return await sendEmailWithTracking(
    {
      to,
      subject: `${getSubjectTitle()} - Tender Hub`,
      html: renderedHtml,
    },
    "user_status_change",
    userId
  );
}

// Types for bulk email data
type ApprovalDecisionEmailData = Parameters<typeof sendApprovalDecisionEmail>[0];
type SystemMaintenanceEmailData = Parameters<typeof sendSystemMaintenanceEmail>[0];
type UserStatusChangeEmailData = Parameters<typeof sendUserStatusChangeEmail>[0];

type BulkEmailData = 
  | { type: "approval_decision"; data: ApprovalDecisionEmailData }
  | { type: "system_maintenance"; data: SystemMaintenanceEmailData }
  | { type: "user_status_change"; data: UserStatusChangeEmailData };

// Bulk email sending for notifications
export async function sendBulkNotificationEmails(
  emails: BulkEmailData[]
): Promise<EmailDeliveryResult[]> {
  const results: EmailDeliveryResult[] = [];
  
  for (const email of emails) {
    try {
      let result: EmailDeliveryResult;
      
      switch (email.type) {
        case "approval_decision":
          result = await sendApprovalDecisionEmail(email.data);
          break;
        case "system_maintenance":
          result = await sendSystemMaintenanceEmail(email.data);
          break;
        case "user_status_change":
          result = await sendUserStatusChangeEmail(email.data);
          break;
        default:
          result = {
            success: false,
            error: "Unknown email type",
            retryCount: 0,
            deliveryTime: 0,
          };
      }
      
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        retryCount: 0,
        deliveryTime: 0,
      });
    }
  }
  
  return results;
}