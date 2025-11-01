import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserEmailPreferences,
  updateEmailPreferences,
  createDefaultEmailPreferences,
  type EmailPreferenceUpdate,
} from "@/lib/email-preferences";
import { AuditLogger } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    let preferences = await getUserEmailPreferences(session.user.id);
    
    // Create default preferences if none exist
    if (!preferences) {
      preferences = await createDefaultEmailPreferences(session.user.id);
    }

    // Log access to email preferences
    await AuditLogger.logSystemAccess(session.user.id, "email_preferences", {
      metadata: {
        action: "email_preferences_viewed",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        preferences: {
          invitations: preferences.invitations,
          passwordReset: preferences.passwordReset,
          emailVerification: preferences.emailVerification,
          accountDeletion: preferences.accountDeletion,
          passwordChanged: preferences.passwordChanged,
          approvalDecisions: preferences.approvalDecisions,
          systemMaintenance: preferences.systemMaintenance,
          userStatusChanges: preferences.userStatusChanges,
          marketingEmails: preferences.marketingEmails,
          weeklyDigest: preferences.weeklyDigest,
          monthlyReport: preferences.monthlyReport,
          immediateNotifications: preferences.immediateNotifications,
          dailyDigest: preferences.dailyDigest,
          weeklyDigestNotifications: preferences.weeklyDigestNotifications,
          lastUpdated: preferences.lastUpdated,
        },
      },
    });

  } catch (error) {
    console.error("Failed to get email preferences:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve email preferences",
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates: EmailPreferenceUpdate = body.preferences;

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid preferences data",
          },
        },
        { status: 400 }
      );
    }

    // Validate preference keys
    const validKeys = [
      "invitations",
      "passwordReset",
      "emailVerification",
      "accountDeletion",
      "passwordChanged",
      "approvalDecisions",
      "systemMaintenance",
      "userStatusChanges",
      "marketingEmails",
      "weeklyDigest",
      "monthlyReport",
      "immediateNotifications",
      "dailyDigest",
      "weeklyDigestNotifications",
    ];

    const invalidKeys = Object.keys(updates).filter(key => !validKeys.includes(key));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_KEYS",
            message: `Invalid preference keys: ${invalidKeys.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    // Update preferences
    const updatedPreferences = await updateEmailPreferences(session.user.id, updates);

    // Log preference changes
    await AuditLogger.logSystemAccess(session.user.id, "email_preferences", {
      metadata: {
        action: "email_preferences_updated",
        changes: updates,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        preferences: {
          invitations: updatedPreferences.invitations,
          passwordReset: updatedPreferences.passwordReset,
          emailVerification: updatedPreferences.emailVerification,
          accountDeletion: updatedPreferences.accountDeletion,
          passwordChanged: updatedPreferences.passwordChanged,
          approvalDecisions: updatedPreferences.approvalDecisions,
          systemMaintenance: updatedPreferences.systemMaintenance,
          userStatusChanges: updatedPreferences.userStatusChanges,
          marketingEmails: updatedPreferences.marketingEmails,
          weeklyDigest: updatedPreferences.weeklyDigest,
          monthlyReport: updatedPreferences.monthlyReport,
          immediateNotifications: updatedPreferences.immediateNotifications,
          dailyDigest: updatedPreferences.dailyDigest,
          weeklyDigestNotifications: updatedPreferences.weeklyDigestNotifications,
          lastUpdated: updatedPreferences.lastUpdated,
        },
      },
      message: "Email preferences updated successfully",
    });

  } catch (error) {
    console.error("Failed to update email preferences:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update email preferences",
        },
      },
      { status: 500 }
    );
  }
}