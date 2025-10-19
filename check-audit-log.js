require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

async function checkAuditLogTable() {
  try {
    console.log("Checking audit_log table...");
    const sql = neon(process.env.DATABASE_URL);

    // Check if table exists
    const tables =
      await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log'`;
    console.log("audit_log table exists:", tables.length > 0);

    if (tables.length > 0) {
      // Check columns
      const columns =
        await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'audit_log' ORDER BY ordinal_position`;
      console.log("audit_log columns:");
      columns.forEach((col) => {
        console.log(
          `  ${col.column_name}: ${col.data_type} ${col.is_nullable === "YES" ? "(nullable)" : "(required)"}`,
        );
      });
    }
  } catch (error) {
    console.error("Error checking audit_log table:", error.message);
    console.error("Full error:", error);
  }
}

checkAuditLogTable();
