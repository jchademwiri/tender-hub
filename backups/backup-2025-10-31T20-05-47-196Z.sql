-- Neon Database Backup Guidance
-- Generated on: 2025-10-31T20:05:50.369Z
-- Database: postgresql://neondb_owner:npg_HkwP0minyrg5@ep-mute-resonance-adqdbfdf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

-- IMPORTANT: Neon databases do not support direct pg_dump/restore operations
-- due to their serverless, connection-pooled architecture.

-- RECOMMENDED BACKUP OPTIONS FOR NEON:

1. NEON DASHBOARD EXPORT:
   - Go to your Neon dashboard: https://neon.tech
   - Navigate to your project → Database → Export
   - Download full database export as SQL file
   - This is the recommended production backup method

2. PROGRAMMATIC EXPORT:
   - Use Neon's HTTP API to export data
   - Consider using a separate connection pooling service
   - Implement custom data export logic

3. READ REPLICA BACKUP:
   - Set up a read replica with direct PostgreSQL access
   - Use pg_dump on the replica for backups
   - Keep the replica in sync for disaster recovery

4. THIRD-PARTY BACKUP SERVICES:
   - Use services like pgBackRest with Neon
   - Consider managed backup solutions

-- Current backup marked as "guidance" rather than actual backup
-- Visit: https://neon.tech/docs/introduction/export-import-datasets/
