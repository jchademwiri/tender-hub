require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

async function checkAdminUser() {
  try {
    console.log("Checking admin user...");
    const sql = neon(process.env.DATABASE_URL);

    const users =
      await sql`SELECT id, email, role, status, email_verified, created_at FROM "user" WHERE email = 'admin@test.com'`;
    console.log("Admin user found:", users.length);
    if (users.length > 0) {
      console.log("Admin user details:", {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        status: users[0].status,
        emailVerified: users[0].email_verified,
        createdAt: users[0].created_at,
      });
    }

    // Check all users
    const allUsers =
      await sql`SELECT id, email, role, status, email_verified FROM "user"`;
    console.log("Total users in database:", allUsers.length);
    allUsers.forEach((user) => {
      console.log(
        `  - ${user.email}: ${user.role} (${user.status}, verified: ${user.email_verified})`,
      );
    });
  } catch (error) {
    console.error("Error checking admin user:", error.message);
    console.error("Full error:", error);
  }
}

checkAdminUser();
