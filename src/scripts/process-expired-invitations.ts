#!/usr/bin/env tsx

/**
 * Script to process expired invitations
 * This should be run periodically (e.g., via cron job) to:
 * 1. Find invitations that have passed their expiry date
 * 2. Mark them as expired in the database
 * 3. Track the expiration event for analytics
 */

import { db } from "@/db";
import { invitation, events } from "@/db/schema";
import { eq, and, sql, lte } from "drizzle-orm";
import { invitationTracking, invitationTrackingUtils } from "@/lib/invitation-tracking";

async function processExpiredInvitations() {
  console.log("🔄 Starting expired invitation processing...");

  try {
    const now = new Date();

    // Find pending invitations that have expired
    const expiredInvitations = await db
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.status, "pending"),
          lte(invitation.expiresAt, now)
        )
      );

    console.log(`📋 Found ${expiredInvitations.length} expired invitations`);

    if (expiredInvitations.length === 0) {
      console.log("✅ No expired invitations to process");
      return { processed: 0, errors: 0 };
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each expired invitation
    for (const inv of expiredInvitations) {
      try {
        console.log(`⏰ Processing expired invitation: ${inv.email} (${inv.id})`);

        // Track the expiration event
        await invitationTracking.trackExpired({
          invitationId: inv.id,
          email: inv.email,
          role: inv.role || "user",
          inviterId: inv.inviterId || undefined,
          metadata: invitationTrackingUtils.generateMetadata({
            originalStatus: inv.status,
            expiredAt: now.toISOString(),
            expiresAt: inv.expiresAt,
            daysSinceCreation: Math.floor(
              (now.getTime() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            )
          })
        });

        processedCount++;
        console.log(`✅ Processed invitation: ${inv.email}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to process invitation ${inv.email}:`, error);
      }
    }

    console.log(`🎉 Completed processing: ${processedCount} successful, ${errorCount} errors`);

    // Log the batch processing event
    await db.insert(events).values({
      eventType: "system",
      eventName: "batch_process_expired_invitations",
      properties: {
        processedCount,
        errorCount,
        totalFound: expiredInvitations.length,
        processedAt: now.toISOString()
      },
      timestamp: now
    });

    return { processed: processedCount, errors: errorCount };

  } catch (error) {
    console.error("💥 Fatal error processing expired invitations:", error);

    // Log the error event
    await db.insert(events).values({
      eventType: "system",
      eventName: "batch_process_error",
      properties: {
        error: error instanceof Error ? error.message : "Unknown error",
        processedAt: new Date().toISOString()
      },
      timestamp: new Date()
    });

    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  processExpiredInvitations()
    .then((result) => {
      console.log("🏁 Script completed successfully:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { processExpiredInvitations };