import { hashPassword } from "better-auth/crypto";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, user } from "@/db/schema";

async function createFirstAdmin(
  email?: string,
  name?: string,
  password?: string,
) {
  console.log("=".repeat(50));
  console.log("CREATE FIRST ADMIN - Tender Hub");
  console.log("=".repeat(50));
  console.log();

  // Check if any admin exists
  const adminCount = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, "admin"));

  if (adminCount[0].count > 0) {
    console.log("❌ Admin already exists. Exiting.");
    process.exit(0);
  }

  // Use provided values or get from command line arguments
  const adminEmail = email || process.argv[2];
  const adminName = name || process.argv[3];
  const adminPassword = password || process.argv[4];

  // Validate required arguments
  if (!adminEmail || !adminName || !adminPassword) {
    console.log(
      "Usage: npx tsx src/scripts/create-first-admin.ts <email> <name> <password>",
    );
    console.log(
      'Example: npx tsx src/scripts/create-first-admin.ts admin@test.com "John Doe" "securepassword123"',
    );
    process.exit(1);
  }

  // Validate
  if (!adminEmail.includes("@")) {
    console.error("❌ Invalid email address");
    process.exit(1);
  }

  if (adminPassword.length < 12) {
    console.error("❌ Password must be at least 12 characters");
    process.exit(1);
  }

  // Create admin
  const adminId = crypto.randomUUID();
  const hashedPassword = await hashPassword(adminPassword);

  await db.insert(user).values({
    id: adminId,
    email: adminEmail,
    name: adminName,
    role: "admin",
    status: "active",
    emailVerified: true,
    createdAt: new Date(),
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId: adminId,
    accountId: adminId,
    providerId: "credential",
    password: hashedPassword,
    createdAt: new Date(),
  });

  console.log();
  console.log("✅ First admin created successfully!");
  console.log("Email:", adminEmail);
  console.log("Name:", adminName);
  console.log("Role: admin");
  console.log();
  console.log("⚠️  You can now sign in at:", process.env.NEXT_PUBLIC_APP_URL);
  console.log();
}

createFirstAdmin().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
