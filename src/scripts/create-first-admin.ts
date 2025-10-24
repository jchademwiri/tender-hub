import { hashPassword } from "better-auth/crypto";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, user } from "@/db/schema";

async function createFirstAdmin(
  email?: string,
  name?: string,
  password?: string,
) {
  // Check if any admin exists
  const adminCount = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, "admin"));

  if (adminCount[0].count > 0) {
    process.exit(0);
  }

  // Use provided values or get from command line arguments
  const adminEmail = email || process.argv[2];
  const adminName = name || process.argv[3];
  const adminPassword = password || process.argv[4];

  // Validate required arguments
  if (!adminEmail || !adminName || !adminPassword) {
    process.exit(1);
  }

  // Validate
  if (!adminEmail.includes("@")) {
    process.exit(1);
  }

  if (adminPassword.length < 12) {
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
}

createFirstAdmin().catch((error) => {
  console.error(
    "Failed to create admin:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
