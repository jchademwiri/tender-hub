import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, backupHistory } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/admin/database/restore - Restore database from backup
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only admins and owners can restore database
    if (session.user.role !== "admin" && session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { backupId } = body;

    if (!backupId) {
      return NextResponse.json(
        { error: "Backup ID is required" },
        { status: 400 },
      );
    }

    // Verify backup exists and is completed
    const backup = await db
      .select()
      .from(backupHistory)
      .where(eq(backupHistory.id, backupId))
      .limit(1);

    if (!backup.length) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const backupRecord = backup[0];

    if (backupRecord.status !== "completed") {
      return NextResponse.json(
        { error: "Can only restore from completed backups" },
        { status: 400 },
      );
    }

    if (!backupRecord.filePath || !existsSync(backupRecord.filePath)) {
      return NextResponse.json(
        { error: "Backup file not found on disk" },
        { status: 400 },
      );
    }

    // Log the restoration attempt
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      action: "database_restoration",
      metadata: {
        backupId,
        backupFile: backupRecord.filePath,
        backupType: backupRecord.backupType,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    // Start restoration process asynchronously
    startRestoreProcess(backupId, backupRecord.filePath);

    return NextResponse.json({
      message: "Database restoration started successfully",
      backupId,
      estimatedDuration: "5-15 minutes",
    });
  } catch (error) {
    console.error("Error starting restoration:", error);
    return NextResponse.json(
      { error: "Failed to start restoration" },
      { status: 500 },
    );
  }
}

// Helper function to execute restoration process
async function startRestoreProcess(_backupId: string, backupPath: string) {
  const startTime = Date.now();

  try {
    // Get database connection details from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Parse database URL to extract connection parameters
    // Supports both standard PostgreSQL and Neon database formats
    // Examples:
    // - postgresql://user:password@localhost:5432/database
    // - postgresql://user:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require
    let urlMatch = databaseUrl.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+)(?::(\d+))?\/([^?]+)/,
    );

    if (!urlMatch) {
      // Try alternative format for edge cases
      urlMatch = databaseUrl.match(
        /postgresql:\/\/([^:]+):([^@]+)@(.+)\/([^?]+)/,
      );
      if (!urlMatch) {
        throw new Error(`Invalid database URL format: ${databaseUrl}`);
      }
      // Extract components from alternative format
      const urlParts = urlMatch[3].split(/[:@]/);
      const host = urlParts[0];
      const port = urlParts[1] || "5432";
      const database = urlMatch[4].split("?")[0]; // Remove query params

      const _username = urlMatch[1];
      const _password = urlMatch[2];

      // Override with parsed values
      urlMatch[3] = host;
      urlMatch[4] = port;
      urlMatch[5] = database;
    }

    const [, username, password, host, port, database] = urlMatch;

    // Set environment variables for pg_restore
    process.env.PGPASSWORD = password;

    // Construct pg_restore command
    // Using custom format to match pg_dump output
    const pgRestoreCommand = `pg_restore -h ${host} -p ${port} -U ${username} -d ${database} -v --clean --no-owner --no-privileges "${backupPath}"`;

    console.log(
      `Starting pg_restore: ${pgRestoreCommand.replace(password, "***")}`,
    );

    // Execute pg_restore
    execSync(pgRestoreCommand, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PGPASSWORD: password },
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`Database restoration completed successfully (${duration}s)`);

    // TODO: Add restoration history tracking
    // This would require adding a restoration_history table or updating backup_history table
  } catch (error) {
    console.error("Database restoration failed:", error);
    const _duration = Math.round((Date.now() - startTime) / 1000);

    // TODO: Update restoration record with failure status
    // This would require adding a restoration tracking system
  }
}
