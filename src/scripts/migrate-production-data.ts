import { db } from "@/db";
import { 
  provinces, 
  publishers, 
  user,
  userBookmarks,
  invitation,
  auditLog
} from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { performDataIntegrityCheck, cleanupExpiredData } from "@/lib/data-validation";

interface MigrationResult {
  success: boolean;
  message: string;
  affectedRecords: number;
  errors: string[];
}

interface MigrationReport {
  migrations: Array<{
    name: string;
    result: MigrationResult;
  }>;
  overall: {
    success: boolean;
    totalMigrations: number;
    successfulMigrations: number;
    failedMigrations: number;
    totalAffectedRecords: number;
  };
}

/**
 * Migration 1: Ensure all provinces have proper descriptions with metadata
 */
async function migrateProvinceDescriptions(): Promise<MigrationResult> {
  try {
    console.log("🔄 Migrating province descriptions...");
    
    const provincesWithoutMetadata = await db
      .select()
      .from(provinces)
      .where(sql`${provinces.description} NOT LIKE '%Capital:%'`);

    let affectedRecords = 0;

    for (const province of provincesWithoutMetadata) {
      // Add metadata to existing descriptions if missing
      if (province.description && !province.description.includes('Capital:')) {
        const enhancedDescription = `${province.description} [Migration: Enhanced with metadata for production readiness]`;
        
        await db
          .update(provinces)
          .set({ description: enhancedDescription })
          .where(eq(provinces.id, province.id));
        
        affectedRecords++;
      }
    }

    return {
      success: true,
      message: `Enhanced descriptions for ${affectedRecords} provinces`,
      affectedRecords,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to migrate province descriptions",
      affectedRecords: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Migration 2: Add audit trail for existing users
 */
async function migrateUserAuditTrail(): Promise<MigrationResult> {
  try {
    console.log("🔄 Creating audit trail for existing users...");
    
    // Get users without audit trail entries
    const usersWithoutAudit = await db
      .select({ id: user.id, email: user.email, createdAt: user.createdAt })
      .from(user)
      .where(sql`${user.id} NOT IN (SELECT DISTINCT ${auditLog.userId} FROM ${auditLog} WHERE ${auditLog.action} = 'user_created')`);

    let affectedRecords = 0;

    for (const userRecord of usersWithoutAudit) {
      await db.insert(auditLog).values({
        id: crypto.randomUUID(),
        userId: userRecord.id,
        action: 'user_created',
        metadata: {
          email: userRecord.email,
          migrated: true,
          originalCreatedAt: userRecord.createdAt
        },
        createdAt: userRecord.createdAt
      });
      
      affectedRecords++;
    }

    return {
      success: true,
      message: `Created audit trail entries for ${affectedRecords} existing users`,
      affectedRecords,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to migrate user audit trail",
      affectedRecords: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Migration 3: Normalize publisher websites (ensure https and proper format)
 */
async function migratePublisherWebsites(): Promise<MigrationResult> {
  try {
    console.log("🔄 Normalizing publisher websites...");
    
    const allPublishers = await db.select().from(publishers);
    let affectedRecords = 0;

    for (const publisher of allPublishers) {
      if (publisher.website) {
        let normalizedWebsite = publisher.website.trim();
        
        // Add https if missing protocol
        if (!normalizedWebsite.startsWith('http://') && !normalizedWebsite.startsWith('https://')) {
          normalizedWebsite = `https://${normalizedWebsite}`;
        }
        
        // Convert http to https for government domains
        if (normalizedWebsite.startsWith('http://') && normalizedWebsite.includes('.gov.za')) {
          normalizedWebsite = normalizedWebsite.replace('http://', 'https://');
        }
        
        // Update if changed
        if (normalizedWebsite !== publisher.website) {
          await db
            .update(publishers)
            .set({ website: normalizedWebsite })
            .where(eq(publishers.id, publisher.id));
          
          affectedRecords++;
        }
      }
    }

    return {
      success: true,
      message: `Normalized websites for ${affectedRecords} publishers`,
      affectedRecords,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to migrate publisher websites",
      affectedRecords: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Migration 4: Clean up duplicate bookmarks
 */
async function migrateDuplicateBookmarks(): Promise<MigrationResult> {
  try {
    console.log("🔄 Cleaning up duplicate bookmarks...");
    
    // Find duplicate bookmarks (same user + publisher combination)
    const duplicates = await db
      .select({
        userId: userBookmarks.userId,
        publisherId: userBookmarks.publisherId,
        count: count()
      })
      .from(userBookmarks)
      .groupBy(userBookmarks.userId, userBookmarks.publisherId)
      .having(sql`count(*) > 1`);

    let affectedRecords = 0;

    for (const duplicate of duplicates) {
      // Keep the oldest bookmark, delete the rest
      const bookmarksToDelete = await db
        .select()
        .from(userBookmarks)
        .where(
          sql`${userBookmarks.userId} = ${duplicate.userId} AND ${userBookmarks.publisherId} = ${duplicate.publisherId}`
        )
        .orderBy(userBookmarks.createdAt)
        .offset(1); // Skip the first (oldest) one

      for (const bookmark of bookmarksToDelete) {
        await db.delete(userBookmarks).where(eq(userBookmarks.id, bookmark.id));
        affectedRecords++;
      }
    }

    return {
      success: true,
      message: `Removed ${affectedRecords} duplicate bookmarks`,
      affectedRecords,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to migrate duplicate bookmarks",
      affectedRecords: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Migration 5: Update invitation statuses based on expiration
 */
async function migrateInvitationStatuses(): Promise<MigrationResult> {
  try {
    console.log("🔄 Updating invitation statuses...");
    
    const now = new Date();
    
    // Update expired invitations
    const expiredResult = await db
      .update(invitation)
      .set({ 
        status: 'expired',
        expiredAt: now
      })
      .where(sql`${invitation.expiresAt} < ${now} AND ${invitation.status} IN ('pending', 'sent', 'opened')`);

    return {
      success: true,
      message: `Updated status for ${expiredResult.rowCount || 0} expired invitations`,
      affectedRecords: expiredResult.rowCount || 0,
      errors: []
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to migrate invitation statuses",
      affectedRecords: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Runs all production data migrations
 */
async function runProductionMigrations(): Promise<MigrationReport> {
  console.log("🚀 Starting production data migrations...");
  console.log("=" .repeat(50));

  const migrations = [
    { name: "Province Descriptions", fn: migrateProvinceDescriptions },
    { name: "User Audit Trail", fn: migrateUserAuditTrail },
    { name: "Publisher Websites", fn: migratePublisherWebsites },
    { name: "Duplicate Bookmarks", fn: migrateDuplicateBookmarks },
    { name: "Invitation Statuses", fn: migrateInvitationStatuses }
  ];

  const results: Array<{ name: string; result: MigrationResult }> = [];
  let totalAffectedRecords = 0;

  for (const migration of migrations) {
    console.log(`\n📋 Running migration: ${migration.name}`);
    
    try {
      const result = await migration.fn();
      results.push({ name: migration.name, result });
      totalAffectedRecords += result.affectedRecords;
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`❌ ${result.message}`);
        if (result.errors.length > 0) {
          result.errors.forEach(error => console.log(`   Error: ${error}`));
        }
      }
    } catch (error) {
      const failedResult: MigrationResult = {
        success: false,
        message: `Migration failed with exception`,
        affectedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      
      results.push({ name: migration.name, result: failedResult });
      console.log(`❌ Migration failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Generate summary
  const successfulMigrations = results.filter(r => r.result.success).length;
  const failedMigrations = results.filter(r => !r.result.success).length;
  const overallSuccess = failedMigrations === 0;

  console.log("\n📊 Migration Summary:");
  console.log(`   Total migrations: ${migrations.length}`);
  console.log(`   Successful: ${successfulMigrations}`);
  console.log(`   Failed: ${failedMigrations}`);
  console.log(`   Total affected records: ${totalAffectedRecords}`);

  // Run data integrity check after migrations
  console.log("\n🔍 Running post-migration data integrity check...");
  const integrityReport = await performDataIntegrityCheck();
  
  if (integrityReport.overall.isHealthy) {
    console.log("✅ Data integrity check passed");
  } else {
    console.log(`⚠️  Data integrity check found ${integrityReport.overall.criticalIssues} critical issues`);
  }

  return {
    migrations: results,
    overall: {
      success: overallSuccess,
      totalMigrations: migrations.length,
      successfulMigrations,
      failedMigrations,
      totalAffectedRecords
    }
  };
}

// Export for use in other scripts
export { runProductionMigrations };

// Run if called directly
if (require.main === module) {
  runProductionMigrations()
    .then((report) => {
      if (report.overall.success) {
        console.log("\n🎉 All migrations completed successfully!");
        process.exit(0);
      } else {
        console.log("\n❌ Some migrations failed. Check the output above for details.");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    });
}