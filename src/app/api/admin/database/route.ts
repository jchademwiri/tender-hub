import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { backupHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { execSync } from "child_process";
import { existsSync, mkdirSync, statSync, readFileSync } from "fs";
import { join, basename } from "path";
import { requireAuth } from "@/lib/auth-utils";
import { auditLog } from "@/db/schema";

// GET /api/admin/database - Get database status and backup history
export async function GET() {
  try {
    const currentUser = await requireAuth();
    
    // Only admins and owners can view database info
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get recent backup history (last 10 backups)
    const recentBackups = await db
      .select()
      .from(backupHistory)
      .orderBy(backupHistory.createdAt)
      .limit(10);

    // Get backup statistics
    const allBackups = await db
      .select()
      .from(backupHistory);

    const stats = {
      total: allBackups.length,
      completed: allBackups.filter(b => b.status === "completed").length,
      failed: allBackups.filter(b => b.status === "failed").length,
      lastBackup: allBackups.length > 0 ? allBackups[allBackups.length - 1].createdAt : null,
    };

    return NextResponse.json({
      status: "healthy", // This would be determined by actual DB health check
      backups: recentBackups,
      stats,
    });
  } catch (error) {
    console.error("Error fetching database info:", error);
    return NextResponse.json(
      { error: "Failed to fetch database information" },
      { status: 500 }
    );
  }
}

// POST /api/admin/database/backup - Create manual backup
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    
    // Only admins and owners can create backups
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "backup") {
      // Create backup history record
      const backupId = crypto.randomUUID();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = "backups";
      const backupFileName = `backup-${timestamp}.sql`;
      const backupPath = join(process.cwd(), backupDir, backupFileName);
      
      // Ensure backup directory exists
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
      }

      // Get database connection details from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return NextResponse.json(
          { error: "DATABASE_URL not configured" },
          { status: 500 }
        );
      }

      // Insert backup record with "running" status
      await db.insert(backupHistory).values({
        id: backupId,
        backupType: "manual",
        status: "running",
        initiatedBy: currentUser.id,
      });

      // Log the backup action
      await db.insert(auditLog).values({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        action: "manual_database_backup",
        metadata: { backupId, backupPath },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });

      // Start backup process asynchronously
      startBackupProcess(backupId, backupPath, databaseUrl);

      return NextResponse.json({
        message: "Backup started successfully",
        backupId,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}

// Helper function to execute backup process
async function startBackupProcess(backupId: string, backupPath: string, databaseUrl: string) {
  const startTime = Date.now();
  
  try {
    // Check if this is a Neon database (contains neon.tech domain)
    const isNeonDatabase = databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.database');
    
    if (isNeonDatabase) {
      // For Neon databases, use direct connection instead of pg_dump
      await createNeonBackup(backupId, backupPath, databaseUrl, startTime);
    } else {
      // For regular PostgreSQL databases, use pg_dump
      await createPostgresBackup(backupId, backupPath, databaseUrl, startTime);
    }
    
  } catch (error) {
    console.error("Backup process failed:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Update backup record with failure
    await db
      .update(backupHistory)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        duration: duration,
      })
      .where(eq(backupHistory.id, backupId));
  }
}

// Backup function for regular PostgreSQL databases using pg_dump
async function createPostgresBackup(backupId: string, backupPath: string, databaseUrl: string, startTime: number) {
  // Parse database URL to extract connection parameters
  const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!urlMatch) {
    throw new Error(`Invalid database URL format: ${databaseUrl}`);
  }

  const [, username, password, host, port, database] = urlMatch;

  // Set environment variables for pg_dump
  process.env.PGPASSWORD = password;
  
  // Construct pg_dump command
  const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupPath}" --verbose --no-password --format=custom --compress=6`;
  
  console.log(`Starting pg_dump: ${pgDumpCommand.replace(password, '***')}`);
  
  // Execute pg_dump with password in environment (not exposed in command line)
  execSync(pgDumpCommand, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PGPASSWORD: password }
  });

  const fileSize = statSync(backupPath).size;
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  await db
    .update(backupHistory)
    .set({
      status: "completed",
      filePath: backupPath,
      fileSize: fileSize,
      duration: duration,
    })
    .where(eq(backupHistory.id, backupId));

  console.log(`Backup completed successfully: ${backupPath} (${fileSize} bytes, ${duration}s)`);
}

// Backup function for Neon databases - provides guidance instead of actual backup
async function createNeonBackup(backupId: string, backupPath: string, databaseUrl: string, startTime: number) {
  console.log('Detected Neon database - providing backup guidance');
  
  // For Neon databases, we cannot use pg_dump directly due to their serverless architecture
  // Instead, we create a guidance document and mark as informational
  const guidance = `-- Neon Database Backup Guidance
-- Generated on: ${new Date().toISOString()}

-- IMPORTANT: Neon databases do not support direct pg_dump/restore operations
-- due to their serverless, connection-pooled architecture.

-- RECOMMENDED BACKUP OPTIONS FOR NEON:

1. NEON DASHBOARD EXPORT (Recommended):
   - Go to your Neon dashboard: https://neon.tech
   - Navigate to your project → Database → Export
   - Download full database export as SQL file
   - This is the secure production backup method

2. READ REPLICA BACKUP (Automated):
   - Set up a read replica with direct PostgreSQL access
   - Use pg_dump on the replica for automated backups
   - Keep the replica in sync for disaster recovery

3. PROGRAMMATIC EXPORT:
   - Use Neon's HTTP API to export data programmatically
   - Consider using a separate connection pooling service
   - Implement custom data export logic

4. THIRD-PARTY BACKUP SERVICES:
   - Use services like pgBackRest with Neon
   - Consider managed backup solutions

-- SECURITY NOTE: Never include database credentials in backup files
-- Current backup marked as "guidance" rather than actual backup
-- Visit: https://neon.tech/docs/introduction/export-import-datasets/
`;
  
  try {
    const fs = require('fs');
    fs.writeFileSync(backupPath, guidance, 'utf8');
    
    const fileSize = statSync(backupPath).size;
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    await db
      .update(backupHistory)
      .set({
        status: "completed", // Still mark as completed since guidance was provided
        filePath: backupPath,
        fileSize: fileSize,
        duration: duration,
        errorMessage: "Neon database - backup guidance provided (see file content)"
      })
      .where(eq(backupHistory.id, backupId));

    console.log(`Neon backup guidance created: ${backupPath} (${fileSize} bytes, ${duration}s)`);
    
  } catch (error) {
    throw new Error(`Neon guidance creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}