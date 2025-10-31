import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { backupHistory } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";
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
        metadata: { backupId },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });

      // In a real implementation, you would:
      // 1. Execute pg_dump or equivalent command
      // 2. Upload backup to storage (S3, etc.)
      // 3. Update backup record with completion status
      
      // For demo purposes, simulate backup completion
      setTimeout(async () => {
        try {
          await db
            .update(backupHistory)
            .set({
              status: "completed",
              filePath: `/backups/backup-${new Date().toISOString().split('T')[0]}.sql`,
              fileSize: 1024 * 1024 * 50, // 50MB for demo
              duration: 120, // 2 minutes for demo
            })
            .where(eq(backupHistory.id, backupId));
        } catch (error) {
          console.error("Error updating backup record:", error);
        }
      }, 2000);

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