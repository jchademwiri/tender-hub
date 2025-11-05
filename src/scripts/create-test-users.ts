// Script to create test users for authentication testing
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

async function createTestUsers() {
  console.log("Creating test users...");
  
  const testUsers = [
    {
      id: "admin-test-1",
      email: "admin@test.com",
      name: "Admin User",
      password: await hash("admin123", 12),
      role: "admin" as const,
      status: "active" as const,
      emailVerified: true,
    },
    {
      id: "manager-test-1",
      email: "manager@test.com",
      name: "Manager User",
      password: await hash("manager123", 12),
      role: "manager" as const,
      status: "active" as const,
      emailVerified: true,
    },
    {
      id: "user-test-1",
      email: "user@test.com",
      name: "Regular User",
      password: await hash("user123", 12),
      role: "user" as const,
      status: "active" as const,
      emailVerified: true,
    }
  ];

  for (const testUser of testUsers) {
    try {
      // Check if user already exists
      const existingUsers = await db.select().from(user).where(eq(user.email, testUser.email)).limit(1);
      
      if (existingUsers.length === 0) {
        await db.insert(user).values(testUser);
        console.log(`✅ Created user: ${testUser.email} (${testUser.role})`);
      } else {
        console.log(`⚠️  User already exists: ${testUser.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${testUser.email}:`, error);
    }
  }
  
  console.log("\n🎉 Test users creation completed!");
  console.log("\nTest credentials:");
  console.log("Admin: admin@test.com / admin123");
  console.log("Manager: manager@test.com / manager123"); 
  console.log("User: user@test.com / user123");
}

// Run the script
createTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create test users:", error);
    process.exit(1);
  });