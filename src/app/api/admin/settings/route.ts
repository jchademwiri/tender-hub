import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, systemSettings } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/admin/settings - Fetch all system settings
export async function GET() {
  try {
    const currentUser = await requireAuth();

    // Only admins and owners can view settings
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await db.select().from(systemSettings);

    // Transform the settings into the expected format
    const settingsMap = settings.reduce(
      (acc, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      },
      {} as Record<string, any>,
    );

    return NextResponse.json({
      general: settingsMap.general || {
        siteName: "Tender Hub",
        siteDescription: "Professional tender and procurement platform",
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true,
      },
      security: settingsMap.security || {
        passwordMinLength: 8,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        twoFactorRequired: false,
        forcePasswordChange: false,
      },
      database: settingsMap.database || {
        backupFrequency: "daily",
        retentionDays: 30,
        autoOptimize: true,
        monitoringEnabled: true,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// POST /api/admin/settings - Update system settings
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    // Only admins and owners can update settings
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: "Settings data is required" },
        { status: 400 },
      );
    }

    // Update each setting category
    for (const [category, values] of Object.entries(settings)) {
      const settingKey = category;

      await db
        .insert(systemSettings)
        .values({
          settingKey,
          settingValue: values,
          updatedBy: currentUser.id,
        })
        .onConflictDoUpdate({
          target: systemSettings.settingKey,
          set: {
            settingValue: values,
            updatedBy: currentUser.id,
            updatedAt: new Date(),
          },
        });
    }

    // Log the settings update
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      action: "update_system_settings",
      metadata: { updatedCategories: Object.keys(settings) },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
