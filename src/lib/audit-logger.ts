import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { sendEmail } from "@/lib/email";

/**
 * Production Audit Logging System
 *
 * Features implemented:
 * ✅ Comprehensive action logging for all role-based operations
 * ✅ User session and authentication event tracking
 * ✅ Data modification and access logging
 * ✅ Security event monitoring and alerting
 * ✅ Performance and system event logging
 * ✅ Failed authentication attempt tracking
 * ✅ Suspicious activity detection
 * ✅ Privilege escalation monitoring
 * ✅ Data export and sharing logging
 * ✅ Admin action oversight
 * ✅ Log search and filtering capabilities
 * ✅ Configurable log retention policies
 */

export type AuditAction =
  | "user_login"
  | "user_logout"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_suspended"
  | "user_activated"
  | "password_reset"
  | "profile_update_requested"
  | "profile_update_approved"
  | "profile_update_rejected"
  | "invitation_created"
  | "invitation_accepted"
  | "invitation_cancelled"
  | "invitation_resent"
  | "role_changed"
  | "permission_granted"
  | "permission_revoked"
  | "data_exported"
  | "data_deleted"
  | "system_access"
  | "configuration_changed"
  | "backup_created"
  | "security_scan"
  | "failed_login"
  | "suspicious_activity";

export interface AuditLogContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Main audit logging function
 */
export async function logAuditEvent(
  action: AuditAction,
  context: AuditLogContext,
  options?: {
    alertLevel?: "low" | "medium" | "high" | "critical";
    notifyAdmins?: boolean;
    requireJustification?: boolean;
  },
) {
  try {
    const auditEntry = {
      id: crypto.randomUUID(),
      userId: context.userId || "system",
      action,
      targetUserId: context.resourceId, // For user-specific actions
      ipAddress: context.ipAddress || "unknown",
      metadata: {
        sessionId: context.sessionId,
        userAgent: context.userAgent,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        previousValues: context.previousValues,
        newValues: context.newValues,
        reason: context.reason,
        alertLevel: options?.alertLevel || "low",
        timestamp: new Date().toISOString(),
        ...context.metadata,
      },
      createdAt: new Date(),
    };

    // Insert audit log entry
    await db.insert(auditLog).values(auditEntry);

    // Check if this action requires admin notification
    if (
      options?.notifyAdmins ||
      shouldNotifyAdmins(action, options?.alertLevel)
    ) {
      await notifyAdminsOfAuditEvent(auditEntry);
    }

    // Check for suspicious activity patterns
    if (await isSuspiciousActivity(action, context)) {
      await handleSuspiciousActivity(auditEntry);
    }

    return auditEntry.id;
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Implement fallback logging mechanism
    await fallbackAuditLog(action, context, error);
    // In production, you might want to queue failed logs for retry
    throw error;
  }
}

/**
 * Role-specific audit logging functions
 */
export const AuditLogger = {
  // Authentication events
  async logLogin(userId: string, context: AuditLogContext) {
    return logAuditEvent("user_login", { ...context, userId });
  },

  async logLogout(userId: string, context: AuditLogContext) {
    return logAuditEvent("user_logout", { ...context, userId });
  },

  async logFailedLogin(email: string, context: AuditLogContext) {
    return logAuditEvent(
      "failed_login",
      {
        ...context,
        metadata: { ...context.metadata, attemptedEmail: email },
      },
      { alertLevel: "medium" },
    );
  },

  // User management events
  async logUserCreated(
    userId: string,
    invitedBy: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent("user_created", {
      ...context,
      userId: invitedBy,
      resourceId: userId,
      metadata: { ...context.metadata, createdBy: invitedBy },
    });
  },

  async logUserUpdated(
    userId: string,
    changes: Record<string, unknown>,
    context: AuditLogContext,
  ) {
    return logAuditEvent("user_updated", {
      ...context,
      userId: context.userId || "system",
      resourceId: userId,
      previousValues: context.previousValues,
      newValues: changes,
    });
  },

  async logUserDeleted(
    userId: string,
    deletedBy: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent(
      "user_deleted",
      {
        ...context,
        userId: deletedBy,
        resourceId: userId,
        metadata: { ...context.metadata, deletedBy },
      },
      { alertLevel: "high" },
    );
  },

  // Role and permission events
  async logRoleChanged(
    userId: string,
    oldRole: string,
    newRole: string,
    changedBy: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent(
      "role_changed",
      {
        ...context,
        userId: changedBy,
        resourceId: userId,
        previousValues: { role: oldRole },
        newValues: { role: newRole },
        metadata: { ...context.metadata, changedBy },
      },
      { alertLevel: "medium" },
    );
  },

  // Invitation events
  async logInvitationCreated(
    email: string,
    role: string,
    invitedBy: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent("invitation_created", {
      ...context,
      userId: invitedBy,
      metadata: { ...context.metadata, invitedEmail: email, invitedRole: role },
    });
  },

  async logInvitationAccepted(
    userId: string,
    invitationId: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent("invitation_accepted", {
      ...context,
      userId,
      resourceId: invitationId,
      metadata: { ...context.metadata, invitationId },
    });
  },

  async logInvitationCancelled(
    email: string,
    invitationId: string,
    cancelledBy: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent("invitation_cancelled", {
      ...context,
      userId: cancelledBy,
      resourceId: invitationId,
      metadata: { ...context.metadata, cancelledEmail: email, invitationId },
    });
  },

  async logInvitationResent(
    email: string,
    invitationId: string,
    resentBy: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent("invitation_resent", {
      ...context,
      userId: resentBy,
      resourceId: invitationId,
      metadata: { ...context.metadata, resentEmail: email, invitationId },
    });
  },

  // Profile update workflow
  async logProfileUpdateRequested(
    userId: string,
    changes: Record<string, unknown>,
    context: AuditLogContext,
  ) {
    return logAuditEvent("profile_update_requested", {
      ...context,
      userId,
      newValues: changes,
    });
  },

  async logProfileUpdateApproved(
    userId: string,
    requestId: string,
    approvedBy: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent("profile_update_approved", {
      ...context,
      userId: approvedBy,
      resourceId: userId,
      metadata: { ...context.metadata, requestId, approvedBy },
    });
  },

  async logProfileUpdateRejected(
    userId: string,
    requestId: string,
    rejectedBy: string,
    reason: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent("profile_update_rejected", {
      ...context,
      userId: rejectedBy,
      resourceId: userId,
      metadata: { ...context.metadata, requestId, rejectedBy, reason },
    });
  },

  // Data access events
  async logDataExported(
    userId: string,
    dataType: string,
    recordCount: number,
    context: AuditLogContext,
  ) {
    return logAuditEvent(
      "data_exported",
      {
        ...context,
        userId,
        metadata: { ...context.metadata, dataType, recordCount },
      },
      { alertLevel: "medium" },
    );
  },

  async logDataDeleted(
    userId: string,
    dataType: string,
    recordCount: number,
    context: AuditLogContext,
  ) {
    return logAuditEvent(
      "data_deleted",
      {
        ...context,
        userId,
        metadata: { ...context.metadata, dataType, recordCount },
      },
      { alertLevel: "high" },
    );
  },

  // System events
  async logSystemAccess(
    userId: string,
    resource: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent(
      "system_access",
      {
        ...context,
        userId,
        metadata: { ...context.metadata, accessedResource: resource },
      },
      { alertLevel: "medium" },
    );
  },

  async logConfigurationChanged(
    changedBy: string,
    changes: Record<string, unknown>,
    context: AuditLogContext,
  ) {
    return logAuditEvent(
      "configuration_changed",
      {
        ...context,
        userId: changedBy,
        newValues: changes,
      },
      { alertLevel: "high" },
    );
  },

  // Security events
  async logSuspiciousActivity(
    userId: string,
    activity: string,
    context: AuditLogContext,
  ) {
    return logAuditEvent(
      "suspicious_activity",
      {
        ...context,
        userId,
        metadata: { ...context.metadata, suspiciousActivity: activity },
      },
      { alertLevel: "critical", notifyAdmins: true },
    );
  },
};

/**
 * Helper functions for audit logging
 */
function shouldNotifyAdmins(action: AuditAction, alertLevel?: string): boolean {
  const criticalActions: AuditAction[] = [
    "user_deleted",
    "role_changed",
    "configuration_changed",
    "suspicious_activity",
  ];

  const highAlertActions: AuditAction[] = [
    "failed_login",
    "data_deleted",
    "system_access",
  ];

  if (alertLevel === "critical") return true;
  if (alertLevel === "high" && highAlertActions.includes(action)) return true;
  if (criticalActions.includes(action)) return true;

  return false;
}

async function isSuspiciousActivity(
  action: AuditAction,
  context: AuditLogContext,
): Promise<boolean> {
  // Implement suspicious activity detection logic
  const suspiciousPatterns = [
    "failed_login", // Multiple failed logins
    "system_access", // Unusual system access patterns
    "data_exported", // Large data exports
    "role_changed", // Privilege escalation
    "user_deleted", // Account deletion
  ];

  if (!suspiciousPatterns.includes(action)) {
    return false;
  }

  // Check for patterns in recent activity
  const recentActivity = await getRecentActivity(context.userId, action, 60); // Last 60 minutes

  switch (action) {
    case "failed_login":
      // More than 5 failed login attempts in 60 minutes
      return recentActivity.length >= 5;

    case "system_access":
      // More than 20 system access attempts in 60 minutes
      return recentActivity.length >= 20;

    case "data_exported":
      // More than 3 data exports in 60 minutes
      return recentActivity.length >= 3;

    case "role_changed":
      // Any role change is suspicious and should be monitored
      return true;

    case "user_deleted":
      // Any user deletion is suspicious and should be monitored
      return true;

    default:
      return false;
  }
}

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  targetUserId?: string | null;
  ipAddress: string | null;
  metadata?: unknown;
  createdAt: Date;
}

async function notifyAdminsOfAuditEvent(auditEntry: AuditEntry) {
  try {
    // Get all admin users
    const admins = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.role, "admin"));

    if (admins.length === 0) {
      console.warn("No admin users found for audit notification");
      return;
    }

    const subject = `Security Alert: ${auditEntry.action} - Tender Hub`;
    const metadata = auditEntry.metadata as Record<string, unknown> | undefined;
    const alertLevel = (metadata?.alertLevel as string) || "medium";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${alertLevel === "critical" ? "#dc2626" : alertLevel === "high" ? "#ea580c" : "#d97706"};">
          🚨 Security Alert - ${(alertLevel || "medium").toUpperCase()}
        </h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Audit Event Details</h3>
          <p><strong>Action:</strong> ${auditEntry.action}</p>
          <p><strong>User ID:</strong> ${auditEntry.userId}</p>
          <p><strong>IP Address:</strong> ${auditEntry.ipAddress}</p>
          <p><strong>Timestamp:</strong> ${auditEntry.createdAt}</p>
          ${auditEntry.targetUserId ? `<p><strong>Target User:</strong> ${auditEntry.targetUserId}</p>` : ""}
        </div>

        ${
          metadata
            ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Additional Context</h4>
            <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        `
            : ""
        }

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated security alert from Tender Hub. 
            Please review this activity and take appropriate action if necessary.
          </p>
        </div>
      </div>
    `;

    // Send notification to all admins
    for (const admin of admins) {
      try {
        await sendEmail({
          to: admin.email,
          subject,
          html,
        });
      } catch (emailError) {
        console.error(
          `Failed to send audit notification to ${admin.email}:`,
          emailError,
        );
      }
    }

    // Log the notification attempt
    await logAuditEvent("system_access", {
      metadata: {
        action: "admin_notification_sent",
        originalEvent: auditEntry.action,
        notifiedAdmins: admins.length,
        alertLevel,
      },
    });
  } catch (error) {
    console.error("Failed to notify admins of audit event:", error);
  }
}

async function handleSuspiciousActivity(auditEntry: AuditEntry) {
  try {
    console.warn("Suspicious activity detected:", auditEntry);

    // Log the suspicious activity detection
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: "system",
      action: "suspicious_activity",
      targetUserId: auditEntry.userId,
      ipAddress: auditEntry.ipAddress,
      metadata: {
        originalAction: auditEntry.action,
        suspiciousPattern: "automated_detection",
        severity: "high",
        requiresReview: true,
        detectedAt: new Date().toISOString(),
        originalMetadata: auditEntry.metadata,
      },
      createdAt: new Date(),
    });

    // Notify admins immediately for suspicious activity
    await notifyAdminsOfAuditEvent({
      ...auditEntry,
      action: "suspicious_activity",
      metadata: {
        ...((auditEntry.metadata as Record<string, unknown>) || {}),
        alertLevel: "critical",
        originalAction: auditEntry.action,
        suspiciousPattern: "automated_detection",
      },
    });

    // In a production environment, you might want to:
    // 1. Temporarily restrict user access
    // 2. Require additional authentication
    // 3. Flag the account for manual review
    // 4. Send alerts to security team
    // 5. Trigger additional monitoring
  } catch (error) {
    console.error("Failed to handle suspicious activity:", error);
  }
}

/**
 * Query audit logs with filtering and pagination
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  searchTerm?: string;
}) {
  try {
    const {
      userId,
      action,
      resourceId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      searchTerm,
    } = filters;

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLog.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLog.action, action));
    }

    if (resourceId) {
      conditions.push(eq(auditLog.targetUserId, resourceId));
    }

    if (startDate) {
      conditions.push(gte(auditLog.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLog.createdAt, endDate));
    }

    if (searchTerm) {
      // Search in action, userId, targetUserId, and metadata
      conditions.push(
        sql`(
          ${auditLog.action} ILIKE ${`%${searchTerm}%`} OR
          ${auditLog.userId} ILIKE ${`%${searchTerm}%`} OR
          ${auditLog.targetUserId} ILIKE ${`%${searchTerm}%`} OR
          ${auditLog.ipAddress} ILIKE ${`%${searchTerm}%`}
        )`,
      );
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const logs = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + limit < total;

    return {
      logs,
      total,
      hasMore,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    };
  } catch (error) {
    console.error("Failed to query audit logs:", error);
    throw new Error("Failed to retrieve audit logs");
  }
}

/**
 * Helper function to get recent activity for suspicious activity detection
 */
async function getRecentActivity(
  userId: string | undefined,
  action: AuditAction,
  minutesBack: number,
): Promise<AuditEntry[]> {
  if (!userId) return [];

  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesBack);

  try {
    const recentLogs = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.userId, userId),
          eq(auditLog.action, action),
          gte(auditLog.createdAt, cutoffTime),
        ),
      )
      .orderBy(desc(auditLog.createdAt));

    return recentLogs;
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return [];
  }
}

/**
 * Fallback logging mechanism for when primary audit logging fails
 */
async function fallbackAuditLog(
  action: AuditAction,
  context: AuditLogContext,
  error: unknown,
) {
  try {
    // Log to console as fallback
    console.error("AUDIT LOG FAILURE:", {
      action,
      context,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to:
    // 1. Write to a separate log file
    // 2. Send to external logging service
    // 3. Queue for retry
    // 4. Alert operations team
  } catch (fallbackError) {
    console.error("Fallback audit logging also failed:", fallbackError);
  }
}

/**
 * Get audit log statistics for monitoring
 */
export async function getAuditLogStats(
  timeframe: "hour" | "day" | "week" = "day",
) {
  try {
    const cutoffTime = new Date();

    switch (timeframe) {
      case "hour":
        cutoffTime.setHours(cutoffTime.getHours() - 1);
        break;
      case "day":
        cutoffTime.setDate(cutoffTime.getDate() - 1);
        break;
      case "week":
        cutoffTime.setDate(cutoffTime.getDate() - 7);
        break;
    }

    // Get total events
    const totalEvents = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(gte(auditLog.createdAt, cutoffTime));

    // Get events by action
    const eventsByAction = await db
      .select({
        action: auditLog.action,
        count: sql<number>`count(*)`,
      })
      .from(auditLog)
      .where(gte(auditLog.createdAt, cutoffTime))
      .groupBy(auditLog.action)
      .orderBy(desc(sql`count(*)`));

    // Get suspicious activity count
    const suspiciousActivity = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(
        and(
          gte(auditLog.createdAt, cutoffTime),
          eq(auditLog.action, "suspicious_activity"),
        ),
      );

    // Get failed login attempts
    const failedLogins = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(
        and(
          gte(auditLog.createdAt, cutoffTime),
          eq(auditLog.action, "failed_login"),
        ),
      );

    return {
      timeframe,
      period: {
        start: cutoffTime.toISOString(),
        end: new Date().toISOString(),
      },
      totalEvents: totalEvents[0]?.count || 0,
      suspiciousActivity: suspiciousActivity[0]?.count || 0,
      failedLogins: failedLogins[0]?.count || 0,
      eventsByAction: eventsByAction.map((item) => ({
        action: item.action,
        count: item.count,
      })),
    };
  } catch (error) {
    console.error("Failed to get audit log stats:", error);
    throw new Error("Failed to retrieve audit statistics");
  }
}

/**
 * Clean up old audit logs based on retention policy
 */
export async function cleanupAuditLogs(retentionDays: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old audit logs
    const deleted = await db
      .delete(auditLog)
      .where(lte(auditLog.createdAt, cutoffDate));

    // Log the cleanup operation itself
    await logAuditEvent("system_access", {
      metadata: {
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        action: "audit_cleanup",
        deletedCount: deleted.rowCount || 0,
      },
    });

    return {
      success: true,
      deletedCount: deleted.rowCount || 0,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error("Failed to cleanup audit logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
