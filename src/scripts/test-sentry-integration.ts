#!/usr/bin/env tsx

/**
 * Test script for Sentry integration
 * This script validates that all Sentry features are working correctly
 */

import { 
  trackAPIError, 
  trackDatabaseError, 
  trackAuthError, 
  trackBusinessError,
  trackPerformanceIssue,
  trackCustomEvent,
  trackSecurityEvent,
  trackFeatureUsage,
  trackBusinessMetric,
  getSentryInfo,
  checkSentryHealth,
  flushSentry
} from "../lib/sentry-utils";
import { 
  checkAlerts, 
  createAlertContext, 
  testAlerts,
  errorMonitor 
} from "../lib/sentry-alerting";
import { getSentryStatus, validateSentryConfig } from "../lib/sentry-init";
import { sentryConfig } from "../lib/env-validation";

/**
 * Test configuration
 */
const TEST_CONFIG = {
  skipDestructiveTests: process.env.NODE_ENV === "production",
  testUserId: "test-user-123",
  testDuration: 5000, // 5 seconds
};

/**
 * Test results interface
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

/**
 * Test runner class
 */
class SentryTestRunner {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running test: ${name}`);
      await testFn();
      
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        passed: true,
        duration,
      });
      
      console.log(`✅ Test passed: ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      
      console.error(`❌ Test failed: ${name} (${duration}ms)`, error);
    }
  }

  getResults() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      total: this.results.length,
      passed,
      failed,
      totalDuration,
      results: this.results,
    };
  }

  printSummary() {
    const summary = this.getResults();
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 SENTRY TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
    
    if (summary.failed > 0) {
      console.log("\n❌ Failed Tests:");
      summary.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    console.log("=".repeat(60));
  }
}

/**
 * Test Sentry configuration
 */
async function testSentryConfiguration(): Promise<void> {
  const config = validateSentryConfig();
  
  if (!config.valid) {
    throw new Error(`Configuration errors: ${config.errors.join(", ")}`);
  }
  
  if (config.warnings.length > 0) {
    console.warn("Configuration warnings:", config.warnings);
  }
  
  const info = getSentryInfo();
  console.log("Sentry configuration:", info);
}

/**
 * Test Sentry connectivity
 */
async function testSentryConnectivity(): Promise<void> {
  const health = await checkSentryHealth();
  
  if (!health.configured) {
    throw new Error("Sentry is not configured");
  }
  
  if (!health.connected) {
    throw new Error(`Sentry connection failed: ${health.errors?.join(", ")}`);
  }
  
  console.log("Sentry health check passed:", health);
}

/**
 * Test error tracking
 */
async function testErrorTracking(): Promise<void> {
  const testError = new Error("Test error for Sentry integration");
  
  // Test API error tracking
  trackAPIError(testError, {
    endpoint: "/api/test",
    method: "POST",
    statusCode: 500,
    userId: TEST_CONFIG.testUserId,
    userRole: "user",
    requestId: "test-req-123",
  });
  
  // Test database error tracking
  trackDatabaseError(testError, {
    operation: "SELECT",
    table: "test_table",
    userId: TEST_CONFIG.testUserId,
  });
  
  // Test auth error tracking
  trackAuthError(testError, {
    action: "login",
    userId: TEST_CONFIG.testUserId,
    email: "test@example.com",
    ipAddress: "127.0.0.1",
  });
  
  // Test business error tracking
  trackBusinessError(testError, {
    feature: "user_management",
    action: "create_user",
    userId: TEST_CONFIG.testUserId,
    userRole: "admin",
    metadata: { testData: true },
  });
  
  console.log("Error tracking tests completed");
}

/**
 * Test performance monitoring
 */
async function testPerformanceMonitoring(): Promise<void> {
  // Test performance issue tracking
  trackPerformanceIssue("Test slow operation", {
    operation: "test_operation",
    duration: 1500,
    threshold: 1000,
    userId: TEST_CONFIG.testUserId,
    metadata: { testData: true },
  });
  
  console.log("Performance monitoring tests completed");
}

/**
 * Test custom event tracking
 */
async function testCustomEventTracking(): Promise<void> {
  // Test custom event
  trackCustomEvent("Test custom event", {
    category: "test",
    level: "info",
    userId: TEST_CONFIG.testUserId,
    tags: { test: "true", environment: "test" },
    metadata: { testData: true },
  });
  
  // Test feature usage tracking
  trackFeatureUsage("test_feature", "test_action", TEST_CONFIG.testUserId, {
    testData: true,
  });
  
  // Test business metric tracking
  trackBusinessMetric("test_metric", 42, "count", {
    userId: TEST_CONFIG.testUserId,
    tags: { test: "true" },
    metadata: { testData: true },
  });
  
  console.log("Custom event tracking tests completed");
}

/**
 * Test security event tracking
 */
async function testSecurityEventTracking(): Promise<void> {
  if (TEST_CONFIG.skipDestructiveTests) {
    console.log("Skipping security event tests in production");
    return;
  }
  
  // Test security event tracking
  trackSecurityEvent("suspicious_login", {
    userId: TEST_CONFIG.testUserId,
    ipAddress: "127.0.0.1",
    userAgent: "Test User Agent",
    endpoint: "/api/auth/login",
    details: { testData: true },
  });
  
  console.log("Security event tracking tests completed");
}

/**
 * Test alerting system
 */
async function testAlertingSystem(): Promise<void> {
  if (TEST_CONFIG.skipDestructiveTests) {
    console.log("Skipping alerting tests in production");
    return;
  }
  
  // Test error monitoring
  errorMonitor.recordError("test_error", TEST_CONFIG.testUserId);
  errorMonitor.recordError("test_error", TEST_CONFIG.testUserId);
  errorMonitor.recordError("test_error", TEST_CONFIG.testUserId);
  
  // Test alert context creation
  const alertContext = createAlertContext({
    errorCount: 5,
    timeWindow: "5m",
    totalRequests: 100,
    affectedUsers: 2,
    averageResponseTime: 800,
    slowestEndpoint: "/api/test",
  });
  
  // Test alert checking (this should not trigger actual alerts in test)
  await checkAlerts(alertContext);
  
  // Test alert system (only in non-production)
  if (sentryConfig.environment !== "production") {
    await testAlerts();
  }
  
  console.log("Alerting system tests completed");
}

/**
 * Test Sentry status reporting
 */
async function testSentryStatus(): Promise<void> {
  const status = await getSentryStatus();
  
  if (!status.initialized) {
    throw new Error("Sentry is not initialized");
  }
  
  if (!status.configured) {
    throw new Error("Sentry is not configured");
  }
  
  console.log("Sentry status:", status);
}

/**
 * Test event flushing
 */
async function testEventFlushing(): Promise<void> {
  const flushed = await flushSentry(5000);
  
  if (!flushed) {
    throw new Error("Failed to flush Sentry events");
  }
  
  console.log("Event flushing test completed");
}

/**
 * Main test execution
 */
async function main() {
  console.log("🚀 Starting Sentry Integration Tests");
  console.log(`Environment: ${sentryConfig.environment}`);
  console.log(`Release: ${sentryConfig.release}`);
  console.log(`Skip Destructive Tests: ${TEST_CONFIG.skipDestructiveTests}`);
  console.log("");
  
  const runner = new SentryTestRunner();
  
  // Run all tests
  await runner.runTest("Configuration Validation", testSentryConfiguration);
  await runner.runTest("Connectivity Test", testSentryConnectivity);
  await runner.runTest("Error Tracking", testErrorTracking);
  await runner.runTest("Performance Monitoring", testPerformanceMonitoring);
  await runner.runTest("Custom Event Tracking", testCustomEventTracking);
  await runner.runTest("Security Event Tracking", testSecurityEventTracking);
  await runner.runTest("Alerting System", testAlertingSystem);
  await runner.runTest("Status Reporting", testSentryStatus);
  await runner.runTest("Event Flushing", testEventFlushing);
  
  // Print summary
  runner.printSummary();
  
  // Exit with appropriate code
  const summary = runner.getResults();
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
}

export { SentryTestRunner, main as runSentryTests };