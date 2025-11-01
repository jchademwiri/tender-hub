/**
 * Database Backup Configuration
 *
 * This file contains configuration options and S3 setup instructions
 * for database backup and restore functionality.
 */

// Local Backup Configuration
export const BACKUP_CONFIG = {
  // Local backup directory (relative to project root)
  localBackupDir: "backups",

  // Backup file naming convention
  fileNamePattern: "backup-{timestamp}.sql",

  // Maximum backup retention in days
  defaultRetentionDays: 30,

  // pg_dump options for optimal backup
  pgDumpOptions: {
    format: "custom", // Custom format for compression
    compressLevel: 6, // Compression level (0-9)
    verbose: true, // Verbose output
    noPassword: true, // Don't prompt for password
  },

  // pg_restore options for safe restoration
  pgRestoreOptions: {
    verbose: true, // Verbose output
    clean: true, // Drop objects before recreating
    noOwner: true, // Don't restore ownership
    noPrivileges: true, // Don't restore privileges
    noPassword: true, // Don't prompt for password
  },
} as const;

/**
 * S3 Configuration Setup
 *
 * When ready to use S3 storage instead of local storage, uncomment and configure:
 */

// Environment Variables to Add to .env
/*
# AWS S3 Configuration for Database Backups
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BACKUP_BUCKET=tender-hub-database-backups

# Optional: Enable S3 backup upload after local backup
ENABLE_S3_BACKUP_UPLOAD=true

# S3 Backup Configuration
S3_BACKUP_PREFIX=database-backups
S3_BACKUP_ENCRYPTION=AES256
S3_DELETE_AFTER_UPLOAD=false  # Set to true to delete local file after S3 upload
*/

// S3 Bucket Policy Recommendations
export const S3_BUCKET_POLICY_RECOMMENDATIONS = {
  bucketName: "tender-hub-database-backups",

  recommendedSettings: {
    // Versioning enabled for backup retention
    versioning: "Enabled",

    // Server-side encryption
    encryption: {
      enabled: true,
      algorithm: "AES256", // or "aws:kms" for advanced encryption
      kmsKeyId: "alias/tender-hub-backup-encryption", // if using KMS
    },

    // Lifecycle policy for cost optimization
    lifecyclePolicy: [
      {
        id: "DeleteOldBackups",
        status: "Enabled",
        filter: { prefix: "database-backups/" },
        expiration: { days: 90 }, // Keep backups for 90 days
        noncurrentVersionExpiration: { noncurrentDays: 30 },
      },
      {
        id: "TransitionToGlacier",
        status: "Enabled",
        filter: { prefix: "database-backups/" },
        transitions: [
          {
            storageClass: "GLACIER",
            transitionInDays: 30,
          },
        ],
      },
    ],

    // Access logging
    logging: {
      enabled: true,
      targetBucket: "tender-hub-access-logs",
      targetPrefix: "backup-access-logs/",
    },

    // Cross-region replication for disaster recovery
    replication: {
      enabled: true,
      destination: "arn:aws:s3:::tender-hub-backup-dr-us-west-2",
      role: "arn:aws:iam::ACCOUNT_ID:role/tender-hub-backup-replication-role",
    },
  },

  iamPolicy: {
    effect: "Allow",
    actions: [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ],
    resources: [
      "arn:aws:s3:::tender-hub-database-backups",
      "arn:aws:s3:::tender-hub-database-backups/*",
    ],
  },
} as const;

// Database Monitoring Configuration
export const MONITORING_CONFIG = {
  // Database connection parameters to monitor
  connectionParams: [
    "active_connections",
    "idle_connections",
    "max_connections",
    "connection_utilization",
  ],

  // Performance metrics to track
  performanceMetrics: [
    {
      name: "cpu_usage",
      query:
        "SELECT 100 - (avg_load) * 100 / count(*) FROM pg_stat_activity WHERE state = 'active';",
      unit: "percentage",
    },
    {
      name: "memory_usage",
      query:
        "SELECT (total - available) * 100 / total FROM pg_tablespace WHERE spcname = 'pg_default';",
      unit: "percentage",
    },
    {
      name: "disk_io",
      query:
        "SELECT * FROM pg_stat_database WHERE datname = current_database();",
      unit: "operations_per_second",
    },
    {
      name: "database_size",
      query: "SELECT pg_database_size(current_database()) as size;",
      unit: "bytes",
    },
  ],

  // Health check queries
  healthChecks: [
    {
      name: "database_connectivity",
      query: "SELECT 1;",
      timeout: 5000,
    },
    {
      name: "replication_lag",
      query:
        "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag;",
      timeout: 5000,
    },
  ],
} as const;

// Backup Schedule Configuration
export const BACKUP_SCHEDULE = {
  // Default backup frequencies
  frequencies: {
    daily: "0 2 * * *", // Daily at 2 AM
    weekly: "0 2 * * 0", // Weekly on Sunday at 2 AM
    monthly: "0 2 1 * *", // Monthly on 1st at 2 AM
  },

  // Retention policies by backup type
  retentionPolicies: {
    daily: { count: 7, unit: "days" },
    weekly: { count: 4, unit: "weeks" },
    monthly: { count: 12, unit: "months" },
  },
} as const;

/**
 * Setup Instructions for Production
 *
 * 1. PostgreSQL Client Tools Installation:
 *    - Windows: Download from postgresql.org
 *    - macOS: brew install postgresql
 *    - Linux: sudo apt install postgresql-client
 *
 * 2. Database Type Detection:
 *    - Regular PostgreSQL: Uses pg_dump/pg_restore with S3 upload
 *    - Neon Database: Provides guidance for dashboard/manual export
 *
 * 3. S3 Configuration (for regular PostgreSQL):
 *    - Create S3 bucket with security policies above
 *    - Set up IAM user with appropriate permissions
 *    - Add environment variables to production
 *    - Enable lifecycle policies for cost optimization
 *
 * 4. Neon Database Backup Strategy:
 *    - Current: Creates guidance files with backup instructions
 *    - Recommended: Use Neon dashboard export feature
 *    - Advanced: Set up read replicas with direct PostgreSQL access
 *    - Automated: Consider third-party backup services
 *
 * 5. Monitoring Setup:
 *    - Grant database user SELECT permissions on system tables
 *    - Configure metrics collection for CPU, memory, connections
 *    - Set up alerts for backup failures
 *    - Monitor disk space for backup directory
 *
 * 6. Production Deployment:
 *    - Run database migrations for new tables
 *    - Test backup/restore functionality with sample data
 *    - Configure automated backup scheduling
 *    - Set up log monitoring and alerting
 *    - Document backup recovery procedures
 */
