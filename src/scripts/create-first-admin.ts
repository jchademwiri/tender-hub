import { db } from "@/db";
import { user, account } from "@/db/schema";
import { hashPassword } from "better-auth/crypto";
import { eq, count } from "drizzle-orm";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createFirstAdmin() {
  console.log("=".repeat(50));
  console.log("CREATE FIRST ADMIN - Tender Hub");
  console.log("=".repeat(50));
  console.log();

  // Check if any admin exists
  const adminCount = await db.select({ count: count() })
    .from(user)
    .where(eq(user.role, "admin"));

  if (adminCount[0].count > 0) {
    console.log("❌ Admin already exists. Exiting.");
    rl.close();
    process.exit(0);
  }

  // Collect admin details
  const email = await question("Admin email: ");
  const name = await question("Admin name: ");
  const password = await question("Admin password (min 12 chars): ");

  // Validate
  if (!email.includes("@")) {
    console.error("❌ Invalid email address");
    rl.close();
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ Password must be at least 12 characters");
    rl.close();
    process.exit(1);
  }

  // Create admin
  const adminId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);

  await db.insert(user).values({
    id: adminId,
    email,
    name,
    role: "admin",
    status: "active",
    emailVerified: true,
    createdAt: new Date()
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId: adminId,
    accountId: adminId,
    providerId: "credential",
    password: hashedPassword,
    createdAt: new Date()
  });

  console.log();
  console.log("✅ First admin created successfully!");
  console.log("Email:", email);
  console.log("Role: admin");
  console.log();
  console.log("⚠️  You can now sign in at:", process.env.NEXT_PUBLIC_APP_URL);
  console.log();

  rl.close();
}

createFirstAdmin().catch((error) => {
  console.error("❌ Error:", error.message);
  rl.close();
  process.exit(1);
});