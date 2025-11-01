import { db } from "@/db";
import { 
  provinces, 
  publishers, 
  user, 
  userBookmarks,
  invitation,
  auditLog,
  profileUpdateRequest 
} from "@/db/schema";
import { eq, count, isNull, sql } from "drizzle-orm";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    warningRecords: number;
  };
}

export interface DataIntegrityReport {
  provinces: ValidationResult;
  publishers: ValidationResult;
  users: ValidationResult;
  bookmarks: ValidationResult;
  invitations: ValidationResult;
  overall: {
    isHealthy: boolean;
    criticalIssues: number;
    warnings: number;
    recommendations: string[];
  };
}

/**
 * Validates province data integrity
 */
export async function validateProvinces(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Get all provinces
    const allProvinces = await db.select().from(provinces);
    const totalRecords = allProvinces.length;

    // Check if we have at least 9 SA provinces (allowing for test data)
    if (totalRecords < 9) {
      errors.push(`Expected at least 9 South African provinces, found ${totalRecords}`);
    } else if (totalRecords > 9) {
      warnings.push(`Found ${totalRecords} provinces (expected 9). May include test data.`);
    }

    // Validate required SA province codes
    const expectedCodes = ['EC', 'FS', 'GP', 'KZN', 'LP', 'MP', 'NC', 'NW', 'WC'];
    const actualCodes = allProvinces.map(p => p.code);
    const missingCodes = expectedCodes.filter(code => !actualCodes.includes(code));
    const extraCodes = actualCodes.filter(code => !expectedCodes.includes(code));

    if (missingCodes.length > 0) {
      errors.push(`Missing required province codes: ${missingCodes.join(', ')}`);
    }

    if (extraCodes.length > 0) {
      warnings.push(`Unexpected province codes found: ${extraCodes.join(', ')}`);
    }

    // Check for duplicate codes
    const duplicateCodes = actualCodes.filter((code, index) => actualCodes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      errors.push(`Duplicate province codes found: ${duplicateCodes.join(', ')}`);
    }

    // Check for empty or invalid data
    let invalidRecords = 0;
    for (const province of allProvinces) {
      if (!province.name || province.name.trim().length === 0) {
        errors.push(`Province with code ${province.code} has empty name`);
        invalidRecords++;
      }
      
      if (!province.code || province.code.length < 2 || province.code.length > 3) {
        errors.push(`Province ${province.name} has invalid code: ${province.code}`);
        invalidRecords++;
      }

      if (!province.description || province.description.trim().length < 10) {
        warnings.push(`Province ${province.name} has insufficient description`);
      }
    }

    const validRecords = totalRecords - invalidRecords;
    const warningRecords = warnings.length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        warningRecords
      }
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to validate provinces: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      summary: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        warningRecords: 0
      }
    };
  }
}

/**
 * Validates publisher data integrity and relationships
 */
export async function validatePublishers(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Get all publishers with province information
    const allPublishers = await db
      .select({
        id: publishers.id,
        name: publishers.name,
        website: publishers.website,
        province_id: publishers.province_id,
        provinceName: provinces.name,
        provinceCode: provinces.code
      })
      .from(publishers)
      .leftJoin(provinces, eq(publishers.province_id, provinces.id));

    const totalRecords = allPublishers.length;
    let invalidRecords = 0;

    // Check for orphaned publishers (no province relationship)
    const orphanedPublishers = allPublishers.filter(p => !p.provinceName);
    if (orphanedPublishers.length > 0) {
      errors.push(`Found ${orphanedPublishers.length} publishers without valid province relationships`);
      invalidRecords += orphanedPublishers.length;
    }

    // Check for duplicate names
    const publisherNames = allPublishers.map(p => p.name);
    const duplicateNames = publisherNames.filter((name, index) => publisherNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push(`Duplicate publisher names found: ${duplicateNames.join(', ')}`);
    }

    // Check for duplicate websites
    const websites = allPublishers.map(p => p.website).filter(Boolean);
    const duplicateWebsites = websites.filter((website, index) => websites.indexOf(website) !== index);
    if (duplicateWebsites.length > 0) {
      errors.push(`Duplicate publisher websites found: ${duplicateWebsites.join(', ')}`);
    }

    // Validate individual publisher data
    for (const publisher of allPublishers) {
      if (!publisher.name || publisher.name.trim().length === 0) {
        errors.push(`Publisher with ID ${publisher.id} has empty name`);
        invalidRecords++;
      }

      if (!publisher.website || publisher.website.trim().length === 0) {
        warnings.push(`Publisher ${publisher.name} has no website`);
      } else {
        // Basic URL validation
        try {
          new URL(publisher.website);
        } catch {
          errors.push(`Publisher ${publisher.name} has invalid website URL: ${publisher.website}`);
          invalidRecords++;
        }
      }
    }

    // Check distribution across provinces
    const publishersByProvince = allPublishers.reduce((acc, pub) => {
      if (pub.provinceCode) {
        acc[pub.provinceCode] = (acc[pub.provinceCode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const provincesWithoutPublishers = ['EC', 'FS', 'GP', 'KZN', 'LP', 'MP', 'NC', 'NW', 'WC']
      .filter(code => !publishersByProvince[code]);

    if (provincesWithoutPublishers.length > 0) {
      warnings.push(`Provinces without publishers: ${provincesWithoutPublishers.join(', ')}`);
    }

    const validRecords = totalRecords - invalidRecords;
    const warningRecords = warnings.length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        warningRecords
      }
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to validate publishers: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      summary: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        warningRecords: 0
      }
    };
  }
}

/**
 * Validates user data integrity
 */
export async function validateUsers(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const allUsers = await db.select().from(user);
    const totalRecords = allUsers.length;
    let invalidRecords = 0;

    // Check for duplicate emails
    const emails = allUsers.map(u => u.email);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      errors.push(`Duplicate user emails found: ${duplicateEmails.join(', ')}`);
    }

    // Validate individual user data
    for (const userRecord of allUsers) {
      if (!userRecord.email || !userRecord.email.includes('@')) {
        errors.push(`User ${userRecord.id} has invalid email: ${userRecord.email}`);
        invalidRecords++;
      }

      if (!userRecord.name || userRecord.name.trim().length === 0) {
        errors.push(`User ${userRecord.id} has empty name`);
        invalidRecords++;
      }

      if (!['owner', 'admin', 'manager', 'user'].includes(userRecord.role)) {
        errors.push(`User ${userRecord.id} has invalid role: ${userRecord.role}`);
        invalidRecords++;
      }

      if (!['active', 'suspended', 'pending'].includes(userRecord.status || '')) {
        errors.push(`User ${userRecord.id} has invalid status: ${userRecord.status}`);
        invalidRecords++;
      }
    }

    // Check for admin users
    const adminCount = allUsers.filter(u => u.role === 'admin' || u.role === 'owner').length;
    if (adminCount === 0) {
      warnings.push('No admin or owner users found - system may be inaccessible');
    }

    // Check for suspended users without ban reason
    const suspendedWithoutReason = allUsers.filter(u => 
      u.status === 'suspended' && (!u.banReason || u.banReason.trim().length === 0)
    );
    if (suspendedWithoutReason.length > 0) {
      warnings.push(`${suspendedWithoutReason.length} suspended users without ban reason`);
    }

    const validRecords = totalRecords - invalidRecords;
    const warningRecords = warnings.length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        warningRecords
      }
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to validate users: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      summary: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        warningRecords: 0
      }
    };
  }
}

/**
 * Validates user bookmarks and relationships
 */
export async function validateBookmarks(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Get all bookmarks with user and publisher information
    const allBookmarks = await db
      .select({
        id: userBookmarks.id,
        userId: userBookmarks.userId,
        publisherId: userBookmarks.publisherId,
        userName: user.name,
        publisherName: publishers.name
      })
      .from(userBookmarks)
      .leftJoin(user, eq(userBookmarks.userId, user.id))
      .leftJoin(publishers, eq(userBookmarks.publisherId, publishers.id));

    const totalRecords = allBookmarks.length;
    let invalidRecords = 0;

    // Check for orphaned bookmarks
    const orphanedUserBookmarks = allBookmarks.filter(b => !b.userName);
    const orphanedPublisherBookmarks = allBookmarks.filter(b => !b.publisherName);

    if (orphanedUserBookmarks.length > 0) {
      errors.push(`Found ${orphanedUserBookmarks.length} bookmarks with invalid user references`);
      invalidRecords += orphanedUserBookmarks.length;
    }

    if (orphanedPublisherBookmarks.length > 0) {
      errors.push(`Found ${orphanedPublisherBookmarks.length} bookmarks with invalid publisher references`);
      invalidRecords += orphanedPublisherBookmarks.length;
    }

    // Check for duplicate bookmarks (same user + publisher)
    const bookmarkKeys = allBookmarks.map(b => `${b.userId}-${b.publisherId}`);
    const duplicateKeys = bookmarkKeys.filter((key, index) => bookmarkKeys.indexOf(key) !== index);
    if (duplicateKeys.length > 0) {
      errors.push(`Found ${duplicateKeys.length} duplicate bookmarks (same user + publisher)`);
    }

    const validRecords = totalRecords - invalidRecords;
    const warningRecords = warnings.length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        warningRecords
      }
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to validate bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      summary: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        warningRecords: 0
      }
    };
  }
}

/**
 * Validates invitation data and cleanup expired invitations
 */
export async function validateInvitations(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const allInvitations = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        inviterId: invitation.inviterId,
        inviterName: user.name
      })
      .from(invitation)
      .leftJoin(user, eq(invitation.inviterId, user.id));

    const totalRecords = allInvitations.length;
    let invalidRecords = 0;

    // Check for orphaned invitations (invalid inviter)
    const orphanedInvitations = allInvitations.filter(i => !i.inviterName);
    if (orphanedInvitations.length > 0) {
      errors.push(`Found ${orphanedInvitations.length} invitations with invalid inviter references`);
      invalidRecords += orphanedInvitations.length;
    }

    // Check for expired invitations that should be cleaned up
    const now = new Date();
    const expiredInvitations = allInvitations.filter(i => 
      i.expiresAt < now && i.status === 'pending'
    );
    
    if (expiredInvitations.length > 0) {
      warnings.push(`Found ${expiredInvitations.length} expired invitations that should be cleaned up`);
    }

    // Validate email formats
    for (const inv of allInvitations) {
      if (!inv.email || !inv.email.includes('@')) {
        errors.push(`Invitation ${inv.id} has invalid email: ${inv.email}`);
        invalidRecords++;
      }

      if (!['pending', 'sent', 'opened', 'accepted', 'expired', 'cancelled', 'declined'].includes(inv.status)) {
        errors.push(`Invitation ${inv.id} has invalid status: ${inv.status}`);
        invalidRecords++;
      }
    }

    const validRecords = totalRecords - invalidRecords;
    const warningRecords = warnings.length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        warningRecords
      }
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to validate invitations: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      summary: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        warningRecords: 0
      }
    };
  }
}

/**
 * Performs comprehensive data integrity check across all tables
 */
export async function performDataIntegrityCheck(): Promise<DataIntegrityReport> {
  console.log("🔍 Starting comprehensive data integrity check...");

  const [provincesResult, publishersResult, usersResult, bookmarksResult, invitationsResult] = await Promise.all([
    validateProvinces(),
    validatePublishers(),
    validateUsers(),
    validateBookmarks(),
    validateInvitations()
  ]);

  // Calculate overall health
  const allResults = [provincesResult, publishersResult, usersResult, bookmarksResult, invitationsResult];
  const criticalIssues = allResults.reduce((sum, result) => sum + result.errors.length, 0);
  const warnings = allResults.reduce((sum, result) => sum + result.warnings.length, 0);
  const isHealthy = criticalIssues === 0;

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!provincesResult.isValid) {
    recommendations.push("Run populate-provinces.ts to fix province data issues");
  }
  
  if (!publishersResult.isValid) {
    recommendations.push("Run populate-publishers.ts to fix publisher data issues");
  }
  
  if (criticalIssues > 0) {
    recommendations.push("Address critical data integrity issues before production deployment");
  }
  
  if (warnings > 0) {
    recommendations.push("Review and address data quality warnings for optimal system performance");
  }

  if (invitationsResult.warnings.some(w => w.includes('expired'))) {
    recommendations.push("Run cleanup script to remove expired invitations");
  }

  return {
    provinces: provincesResult,
    publishers: publishersResult,
    users: usersResult,
    bookmarks: bookmarksResult,
    invitations: invitationsResult,
    overall: {
      isHealthy,
      criticalIssues,
      warnings,
      recommendations
    }
  };
}

/**
 * Cleans up expired and invalid data
 */
export async function cleanupExpiredData(): Promise<{
  expiredInvitations: number;
  orphanedBookmarks: number;
  invalidSessions: number;
}> {
  console.log("🧹 Starting data cleanup...");

  const now = new Date();
  let expiredInvitations = 0;
  let orphanedBookmarks = 0;
  let invalidSessions = 0;

  try {
    // Clean up expired invitations
    const expiredInvitationResult = await db
      .update(invitation)
      .set({ status: 'expired' })
      .where(sql`${invitation.expiresAt} < ${now} AND ${invitation.status} = 'pending'`);
    
    expiredInvitations = expiredInvitationResult.rowCount || 0;

    // Clean up orphaned bookmarks (bookmarks for deleted users or publishers)
    const orphanedUserBookmarks = await db
      .delete(userBookmarks)
      .where(sql`${userBookmarks.userId} NOT IN (SELECT id FROM ${user})`);
    
    const orphanedPublisherBookmarks = await db
      .delete(userBookmarks)
      .where(sql`${userBookmarks.publisherId} NOT IN (SELECT id FROM ${publishers})`);

    orphanedBookmarks = (orphanedUserBookmarks.rowCount || 0) + (orphanedPublisherBookmarks.rowCount || 0);

    console.log(`✅ Cleanup completed: ${expiredInvitations} expired invitations, ${orphanedBookmarks} orphaned bookmarks`);

    return {
      expiredInvitations,
      orphanedBookmarks,
      invalidSessions
    };

  } catch (error) {
    console.error("❌ Data cleanup failed:", error);
    throw error;
  }
}

/**
 * Generates a detailed data integrity report
 */
export function generateIntegrityReport(report: DataIntegrityReport): string {
  const lines: string[] = [];
  
  lines.push("📊 DATA INTEGRITY REPORT");
  lines.push("=" .repeat(50));
  lines.push("");
  
  // Overall status
  lines.push(`🏥 Overall System Health: ${report.overall.isHealthy ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
  lines.push(`🚨 Critical Issues: ${report.overall.criticalIssues}`);
  lines.push(`⚠️  Warnings: ${report.overall.warnings}`);
  lines.push("");

  // Individual table reports
  const tables = [
    { name: 'Provinces', result: report.provinces },
    { name: 'Publishers', result: report.publishers },
    { name: 'Users', result: report.users },
    { name: 'Bookmarks', result: report.bookmarks },
    { name: 'Invitations', result: report.invitations }
  ];

  for (const table of tables) {
    lines.push(`📋 ${table.name.toUpperCase()}`);
    lines.push(`   Status: ${table.result.isValid ? '✅ Valid' : '❌ Issues Found'}`);
    lines.push(`   Records: ${table.result.summary.totalRecords} total, ${table.result.summary.validRecords} valid`);
    
    if (table.result.errors.length > 0) {
      lines.push(`   Errors:`);
      table.result.errors.forEach(error => lines.push(`     • ${error}`));
    }
    
    if (table.result.warnings.length > 0) {
      lines.push(`   Warnings:`);
      table.result.warnings.forEach(warning => lines.push(`     • ${warning}`));
    }
    
    lines.push("");
  }

  // Recommendations
  if (report.overall.recommendations.length > 0) {
    lines.push("💡 RECOMMENDATIONS");
    lines.push("-".repeat(30));
    report.overall.recommendations.forEach(rec => lines.push(`• ${rec}`));
    lines.push("");
  }

  return lines.join("\n");
}