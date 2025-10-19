require("dotenv").config();
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");

async function checkDatabase() {
  try {
    console.log("Checking database structure...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

    const sql = neon(process.env.DATABASE_URL);
    const _db = drizzle({ client: sql });

    // Check what tables exist
    const tables =
      await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(
      "Tables in database:",
      tables.map((t) => t.table_name),
    );

    // Check invitation table columns if it exists
    if (tables.some((t) => t.table_name === "invitation")) {
      const columns =
        await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'invitation' ORDER BY ordinal_position`;
      console.log("Invitation table columns:");
      columns.forEach((col) => {
        console.log(
          `  ${col.column_name}: ${col.data_type} ${col.is_nullable === "YES" ? "(nullable)" : "(required)"}`,
        );
      });
    } else {
      console.log("Invitation table does not exist");
    }
  } catch (error) {
    console.error("Database check failed:", error.message);
    console.error("Full error:", error);
  }
}

checkDatabase();
