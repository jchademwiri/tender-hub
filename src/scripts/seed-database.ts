import { populateProvinces } from "./populate-provinces";
import { populatePublishers } from "./populate-publishers";
import { performDataIntegrityCheck, cleanupExpiredData, generateIntegrityReport } from "@/lib/data-validation";

interface SeedOptions {
  skipProvinces?: boolean;
  skipPublishers?: boolean;
  skipValidation?: boolean;
  skipCleanup?: boolean;
  force?: boolean;
}

async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  console.log("🌱 Starting database seeding process...");
  console.log("=" .repeat(50));

  try {
    // Step 1: Populate provinces
    if (!options.skipProvinces) {
      console.log("\n📍 Step 1: Populating South African provinces...");
      await populateProvinces();
    } else {
      console.log("\n📍 Step 1: Skipping provinces population");
    }

    // Step 2: Populate publishers
    if (!options.skipPublishers) {
      console.log("\n🏢 Step 2: Populating South African publishers...");
      await populatePublishers();
    } else {
      console.log("\n🏢 Step 2: Skipping publishers population");
    }

    // Step 3: Data cleanup
    if (!options.skipCleanup) {
      console.log("\n🧹 Step 3: Cleaning up expired and invalid data...");
      const cleanupResult = await cleanupExpiredData();
      console.log(`   • Expired invitations processed: ${cleanupResult.expiredInvitations}`);
      console.log(`   • Orphaned bookmarks removed: ${cleanupResult.orphanedBookmarks}`);
    } else {
      console.log("\n🧹 Step 3: Skipping data cleanup");
    }

    // Step 4: Data integrity validation
    if (!options.skipValidation) {
      console.log("\n🔍 Step 4: Performing data integrity validation...");
      const integrityReport = await performDataIntegrityCheck();
      
      console.log("\n" + generateIntegrityReport(integrityReport));
      
      if (!integrityReport.overall.isHealthy) {
        if (options.force) {
          console.log("⚠️  Data integrity issues detected but continuing due to --force flag");
        } else {
          throw new Error(`Data integrity validation failed with ${integrityReport.overall.criticalIssues} critical issues. Use --force to override.`);
        }
      }
    } else {
      console.log("\n🔍 Step 4: Skipping data integrity validation");
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("=" .repeat(50));
    console.log("✅ Your database is now populated with production-ready South African data");
    console.log("📊 You can now run the application with real tender publisher information");

  } catch (error) {
    console.error("\n❌ Database seeding failed:");
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

// Parse command line arguments
function parseArguments(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};

  for (const arg of args) {
    switch (arg) {
      case '--skip-provinces':
        options.skipProvinces = true;
        break;
      case '--skip-publishers':
        options.skipPublishers = true;
        break;
      case '--skip-validation':
        options.skipValidation = true;
        break;
      case '--skip-cleanup':
        options.skipCleanup = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Database Seeding Script

Usage: npm run seed-database [options]

Options:
  --skip-provinces    Skip populating provinces data
  --skip-publishers   Skip populating publishers data
  --skip-validation   Skip data integrity validation
  --skip-cleanup      Skip cleaning up expired data
  --force             Continue even if validation fails
  --help, -h          Show this help message

Examples:
  npm run seed-database                    # Full seeding with validation
  npm run seed-database --skip-validation # Seed without validation
  npm run seed-database --force           # Seed and ignore validation errors
        `);
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
        break;
    }
  }

  return options;
}

// Export for use in other scripts
export { seedDatabase };

// Run if called directly
if (require.main === module) {
  const options = parseArguments();
  
  seedDatabase(options)
    .then(() => {
      console.log("✅ Seeding script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding script failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    });
}