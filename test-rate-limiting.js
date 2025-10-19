// Test script for rate limiting functionality
const https = require("node:http");

const BASE_URL = "http://localhost:3000";
const TEST_ENDPOINTS = [
  "/api/auth/session", // General endpoint (10 req/min)
  "/api/auth/sign-in/email", // Sign-in endpoint (3 req/min)
  "/api/auth/forget-password", // Password reset (3 req/5min)
];

async function testRateLimiting() {
  console.log("🧪 Testing Rate Limiting Functionality...\n");

  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`Testing ${endpoint}...`);

    // Test normal requests (should work)
    for (let i = 1; i <= 3; i++) {
      try {
        const response = await makeRequest(endpoint);
        console.log(`  ✅ Request ${i}: ${response.statusCode}`);
      } catch (error) {
        console.log(`  ❌ Request ${i}: ${error.message}`);
      }

      // Small delay between requests
      await sleep(500);
    }

    console.log("");
  }

  console.log("✅ Rate limiting test completed!");
}

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `${BASE_URL}${endpoint}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        resolve(res);
      },
    );

    req.on("error", reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the test
testRateLimiting().catch(console.error);
