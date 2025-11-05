// Comprehensive authentication test script
import { db } from "@/db";
import { user, session } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function testDatabaseConnection() {
  console.log("🔗 Testing database connection...");
  try {
    const users = await db.select().from(user).limit(1);
    console.log("✅ Database connection successful");
    console.log(`📊 Total users in database: ${users.length > 0 ? 'Users found' : 'No users found'}`);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function testGetUserByEmail() {
  console.log("\n🔍 Testing getUserByEmail function...");
  try {
    const adminUser = await db.select().from(user).where(eq(user.email, "admin@test.com")).limit(1);
    
    if (adminUser.length > 0) {
      console.log("✅ Admin user found:", adminUser[0].email, adminUser[0].role);
      return adminUser[0];
    } else {
      console.log("❌ Admin user not found");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return null;
  }
}

async function testAuthAPI() {
  console.log("\n🔐 Testing authentication API...");
  
  // Test sign in with admin credentials
  try {
    const result = await auth.api.signInEmail({
      headers: new Headers(),
      body: { email: "admin@test.com", password: "admin123" }
    });
    
    if (result.user && result.session) {
      console.log("✅ Admin sign-in successful:");
      console.log(`   User: ${result.user.name} (${result.user.role})`);
      console.log(`   Session ID: ${result.session.id}`);
      console.log(`   Expires: ${result.session.expiresAt}`);
      return result;
    } else {
      console.log("❌ Admin sign-in failed:", result.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Auth API test failed:", error);
    return null;
  }
}

async function testGetSession() {
  console.log("\n🪪 Testing session retrieval...");
  
  try {
    // First sign in to get a session
    const signInResult = await auth.api.signInEmail({
      headers: new Headers(),
      body: { email: "manager@test.com", password: "manager123" }
    });
    
    if (!signInResult.session) {
      console.log("❌ No session created during sign-in");
      return false;
    }
    
    // Now test session retrieval
    const headers = new Headers();
    headers.set("cookie", `session=${signInResult.session.token}`);
    
    const sessionResult = await auth.api.getSession({ headers });
    
    if (sessionResult && sessionResult.user) {
      console.log("✅ Session retrieval successful:");
      console.log(`   User: ${sessionResult.user.name} (${sessionResult.user.role})`);
      return true;
    } else {
      console.log("❌ Session retrieval failed");
      console.log("   Session data received:", sessionResult);
      return false;
    }
  } catch (error) {
    console.error("❌ Session test failed:", error);
    return false;
  }
}

async function testRoleBasedAccess() {
  console.log("\n👥 Testing role-based access...");
  
  const testUsers = [
    { email: "admin@test.com", password: "admin123", expectedRole: "admin" },
    { email: "manager@test.com", password: "manager123", expectedRole: "manager" },
    { email: "user@test.com", password: "user123", expectedRole: "user" }
  ];
  
  let allPassed = true;
  
  for (const testUser of testUsers) {
    try {
      const result = await auth.api.signInEmail({
        headers: new Headers(),
        body: { email: testUser.email, password: testUser.password }
      });
      
      if (result.user && result.user.role === testUser.expectedRole) {
        console.log(`✅ ${testUser.expectedRole.toUpperCase()} role verification passed`);
      } else {
        console.log(`❌ ${testUser.expectedRole.toUpperCase()} role verification failed`);
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ Error testing ${testUser.expectedRole} role:`, error);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testInvalidCredentials() {
  console.log("\n🚫 Testing invalid credentials...");
  
  try {
    const result = await auth.api.signInEmail({
      headers: new Headers(),
      body: { email: "admin@test.com", password: "wrongpassword" }
    });
    
    if (result.error) {
      console.log("✅ Invalid credentials properly rejected:", result.error.message);
      return true;
    } else {
      console.log("❌ Invalid credentials were not rejected");
      return false;
    }
  } catch (error) {
    console.error("❌ Invalid credentials test failed:", error);
    return false;
  }
}

async function runAllTests() {
  console.log("🧪 Running comprehensive authentication tests...\n");
  
  const results = {
    database: await testDatabaseConnection(),
    getUser: await testGetUserByEmail(),
    authAPI: await testAuthAPI(),
    session: await testGetSession(),
    roles: await testRoleBasedAccess(),
    invalidCreds: await testInvalidCredentials()
  };
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`❌ Failed: ${total - passed}/${total} tests`);
  
  if (passed === total) {
    console.log("\n🎉 All tests passed! Authentication system is working correctly.");
    console.log("\n📝 Next steps:");
    console.log("1. The application now uses database-driven authentication");
    console.log("2. Users will be retrieved from the database, not from mock data");
    console.log("3. Role-based access control is functional");
    console.log("4. Guest user fallbacks have been removed");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the errors above.");
  }
  
  console.log("\n🔐 Test Credentials:");
  console.log("Admin: admin@test.com / admin123");
  console.log("Manager: manager@test.com / manager123");
  console.log("User: user@test.com / user123");
}

// Run the tests
runAllTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test suite failed:", error);
    process.exit(1);
  });