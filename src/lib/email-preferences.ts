import { db } from "@/db";
import { emailPreferences, emailDeliveryLog, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { EmailPreferences, NewEmailPreferences, EmailDeliveryLog } from "@/db/schema";

export interface EmailPreferenceUpdate {
  invitations?: boolean;
  passwordReset?: boolean;
  emailVerification?: boolean;
  accountDeletion?: boolean;
  passwordChanged?: boolean;
  approvalDecisions?: boolean;
  systemMaintenance?: boolean;
  userStatusChanges?: boolean;
  marketingEmails?: boolean;
  weeklyDigest?: boolean;
  monthlyReport?: boolean;
  immediateNotifications?: boolean;
  dailyDigest?: boolean;
  weeklyDigestNotifications?: boolean;
}

export interface UnsubscribeOptions {
  emailType?: string;
  reason?: string;
  unsubscribeAll?: boolean;
}

// Get user email preferences
export async function getUserEmailPreferences(userId: string): Promise<EmailPreferences | null> {
  try {
    const preferences = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);

    return preferences[0] || null;
  } catch (error) {
    console.error("Failed to get user email preferences:", error);
    throw new Error("Unable to retrieve email preferences");
  }
}

// Create default email preferences for new user
export async function createDefaultEmailPreferences(userId: string): Promise<EmailPreferences> {
  try {
    const defaultPreferences: NewEmailPreferences = {
      userId,
      invitations: true,
      passwordReset: true,
      emailVerification: true,
      accountDeletion: true,
      passwordChanged: true,
      approvalDecisions: true,
      systemMaintenance: true,
      userStatusChanges: true,
      marketingEmails: false,
      weeklyDigest: true,
      monthlyReport: true,
      immediateNotifications: true,
      dailyDigest: false,
      weeklyDigestNotifications: false,
      unsubscribeToken: generateUnsubscribeToken(),
    };

    const created = await db
      .insert(emailPreferences)
      .values(defaultPreferences)
      .returning();

    return created[0];
  } catch (error) {
    console.error("Failed to create default email preferences:", error);
    throw new Error("Unable to create email preferences");
  }
}

// Update user email preferences
export async function updateEmailPreferences(
  userId: string,
  updates: EmailPreferenceUpdate
): Promise<EmailPreferences> {
  try {
    // Ensure preferences exist
    let preferences = await getUserEmailPreferences(userId);
    if (!preferences) {
      preferences = await createDefaultEmailPreferences(userId);
    }

    const updated = await db
      .update(emailPreferences)
      .set({
        ...updates,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(emailPreferences.userId, userId))
      .returning();

    return updated[0];
  } catch (error) {
    console.error("Failed to update email preferences:", error);
    throw new Error("Unable to update email preferences");
  }
}

// Check if user can receive specific email type
export async function canReceiveEmail(
  userId: string,
  emailType: keyof EmailPreferenceUpdate
): Promise<boolean> {
  try {
    const preferences = await getUserEmailPreferences(userId);
    
    // If no preferences exist, create defaults and allow email
    if (!preferences) {
      await createDefaultEmailPreferences(userId);
      return true;
    }

    // Check if user has unsubscribed completely
    if (preferences.unsubscribedAt) {
      return false;
    }

    // Check specific email type preference
    return preferences[emailType] === true;
  } catch (error) {
    console.error("Failed to check email permission:", error);
    // Default to allowing email if there's an error
    return true;
  }
}

// Generate unique unsubscribe token
function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

// Unsubscribe user from emails
export async function unsubscribeUser(
  token: string,
  options: UnsubscribeOptions = {}
): Promise<{ success: boolean; message: string }> {
  try {
    const preferences = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.unsubscribeToken, token))
      .limit(1);

    if (!preferences[0]) {
      return {
        success: false,
        message: "Invalid unsubscribe token",
      };
    }

    const preference = preferences[0];

    if (options.unsubscribeAll) {
      // Unsubscribe from all emails
      await db
        .update(emailPreferences)
        .set({
          invitations: false,
          passwordReset: true, // Keep security emails enabled
          emailVerification: true, // Keep security emails enabled
          accountDeletion: true, // Keep security emails enabled
          passwordChanged: true, // Keep security emails enabled
          approvalDecisions: false,
          systemMaintenance: false,
          userStatusChanges: false,
          marketingEmails: false,
          weeklyDigest: false,
          monthlyReport: false,
          immediateNotifications: false,
          dailyDigest: false,
          weeklyDigestNotifications: false,
          unsubscribedAt: new Date(),
          unsubscribeReason: options.reason || "User requested unsubscribe from all emails",
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailPreferences.id, preference.id));

      return {
        success: true,
        message: "Successfully unsubscribed from all non-security emails",
      };
    } else if (options.emailType) {
      // Unsubscribe from specific email type
      const updateData: Partial<EmailPreferenceUpdate> = {
        [options.emailType as keyof EmailPreferenceUpdate]: false,
      };

      await db
        .update(emailPreferences)
        .set({
          ...updateData,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailPreferences.id, preference.id));

      return {
        success: true,
        message: `Successfully unsubscribed from ${options.emailType} emails`,
      };
    }

    return {
      success: false,
      message: "No unsubscribe action specified",
    };
  } catch (error) {
    console.error("Failed to unsubscribe user:", error);
    return {
      success: false,
      message: "Unable to process unsubscribe request",
    };
  }
}

// Get unsubscribe URL for user
export async function getUnsubscribeUrl(
  userId: string,
  emailType?: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || "https://tenderhub.com"
): Promise<string> {
  try {
    let preferences = await getUserEmailPreferences(userId);
    if (!preferences) {
      preferences = await createDefaultEmailPreferences(userId);
    }

    const params = new URLSearchParams({
      token: preferences.unsubscribeToken || "",
    });

    if (emailType) {
      params.set("type", emailType);
    }

    return `${baseUrl}/unsubscribe?${params.toString()}`;
  } catch (error) {
    console.error("Failed to generate unsubscribe URL:", error);
    return `${baseUrl}/unsubscribe`;
  }
}

// Log email delivery for tracking
export async function logEmailDelivery(data: {
  userId?: string;
  recipient: string;
  emailType: string;
  subject: string;
  messageId?: string;
  status: "sent" | "delivered" | "bounced" | "failed";
  deliveryTime?: number;
  retryCount?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await db.insert(emailDeliveryLog).values({
      userId: data.userId,
      recipient: data.recipient,
      emailType: data.emailType,
      subject: data.subject,
      messageId: data.messageId,
      status: data.status,
      deliveryTime: data.deliveryTime,
      retryCount: data.retryCount || 0,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
      sentAt: new Date(),
      deliveredAt: data.status === "delivered" ? new Date() : undefined,
      bouncedAt: data.status === "bounced" ? new Date() : undefined,
    });
  } catch (error) {
    console.error("Failed to log email delivery:", error);
    // Don't throw error as this is logging functionality
  }
}

// Get email delivery statistics
export async function getEmailDeliveryStats(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  bounceRate: number;
}> {
  try {
    // This would implement actual statistics calculation
    // For now, return default values
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalBounced: 0,
      totalFailed: 0,
      deliveryRate: 0,
      bounceRate: 0,
    };
  } catch (error) {
    console.error("Failed to get email delivery stats:", error);
    throw new Error("Unable to retrieve email statistics");
  }
}

// Bulk update email preferences for multiple users
export async function bulkUpdateEmailPreferences(
  userIds: string[],
  updates: EmailPreferenceUpdate
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await updateEmailPreferences(userId, updates);
      success++;
    } catch (error) {
      console.error(`Failed to update preferences for user ${userId}:`, error);
      failed++;
    }
  }

  return { success, failed };
}