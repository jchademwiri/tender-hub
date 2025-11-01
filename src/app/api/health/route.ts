import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { Resend } from "resend";
import { AuditLogger } from "@/lib/audit-logger";
import { getPerformanceHealth } from "@/lib/performance-monitor";
import { getCacheHealth } from "@/lib/cache-production";
import { withErrorHandler, createSuccessResponse } from "@/lib/api-error-handler";
import { trackCustomEvent, checkSentryHealth } from "@/lib/sentry-utils";

const resend = new Resend(process.env.RESEND_API_KEY);

interface HealthCheckResult {
  service: string;
  status: "healthy" | "warning" | "critical";
  responseTime: number;
  details?: any;
  error?: string;
}

interface SystemHealthResponse {
  success: boolean;
  status: "healthy" | "warning" | "critical";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
}

async function healthCheckHandler(request: NextRequest) {
  const startTime = Date.now();
  const healthChecks: HealthCheckResult[] = [];
  
  try {
    // Get request context for audit logging
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";

    // 1. Database connectivity health check
    const dbHealth = await checkDatabaseHealth();
    healthChecks.push(dbHealth);

    // 2. Email service health check
    const emailHealth = await checkEmailServiceHealth();
    healthChecks.push(emailHealth);

    // 3. Performance monitoring health check
    const performanceHealth = await checkPerformanceHealth();
    healthChecks.push(performanceHealth);

    // 4. Cache system health check
    const cacheHealth = await checkCacheHealth();
    healthChecks.push(cacheHealth);

    // 5. Sentry monitoring health check
    const sentryHealth = await checkSentryMonitoringHealth();
    healthChecks.push(sentryHealth);

    // 6. External dependencies health check
    const externalHealth = await checkExternalDependencies();
    healthChecks.push(...externalHealth);

    // Calculate overall system status
    const criticalCount = healthChecks.filter(h => h.status === "critical").length;
    const warningCount = healthChecks.filter(h => h.status === "warning").length;
    const healthyCount = healthChecks.filter(h => h.status === "healthy").length;

    let overallStatus: "healthy" | "warning" | "critical" = "healthy";
    if (criticalCount > 0) {
      overallStatus = "critical";
    } else if (warningCount > 0) {
      overallStatus = "warning";
    }

    const totalTime = Date.now() - startTime;
    const uptime = process.uptime();

    const response: SystemHealthResponse = {
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "unknown",
      services: healthChecks,
      summary: {
        total: healthChecks.length,
        healthy: healthyCount,
        warning: warningCount,
        critical: criticalCount,
      },
    };

    // Log health check to audit trail
    await AuditLogger.logSystemAccess("system", "health_check", {
      metadata: {
        status: overallStatus,
        responseTime: totalTime,
        servicesChecked: healthChecks.length,
        criticalIssues: criticalCount,
        warningIssues: warningCount,
        userAgent,
        ipAddress,
      },
    });

    // Track health check in Sentry if there are issues
    if (overallStatus !== "healthy") {
      trackCustomEvent("Health check completed with issues", {
        category: "health_check",
        level: overallStatus === "critical" ? "error" : "warning",
        tags: {
          status: overallStatus,
          critical_count: criticalCount.toString(),
          warning_count: warningCount.toString(),
        },
        metadata: {
          services: healthChecks.map(h => ({ service: h.service, status: h.status })),
        },
      });
    }

    // Return appropriate HTTP status code based on health
    const httpStatus = overallStatus === "critical" ? 503 : 200;

    return createSuccessResponse(response, httpStatus);

  } catch (error) {
    console.error("Health check failed:", error);
    
    const errorResponse = {
      success: false,
      status: "critical" as const,
      timestamp: new Date().toISOString(),
      error: {
        code: "HEALTH_CHECK_FAILED",
        message: "System health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      services: healthChecks, // Include any checks that completed
    };

    // Log health check failure
    try {
      await AuditLogger.logSystemAccess("system", "health_check_failed", {
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          completedChecks: healthChecks.length,
          responseTime: Date.now() - startTime,
        },
      });
    } catch (auditError) {
      console.error("Failed to log health check failure:", auditError);
    }

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    await db.execute(sql`SELECT 1 as health_check`);
    
    // Test a more complex query to verify schema
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN "emailVerified" = true THEN 1 END) as verified_users
      FROM "user"
    `);
    
    const responseTime = Date.now() - startTime;
    
    // Check if response time is acceptable
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (responseTime > 1000) {
      status = "critical";
    } else if (responseTime > 500) {
      status = "warning";
    }

    return {
      service: "database",
      status,
      responseTime,
      details: {
        connectionPool: "active",
        queryTime: responseTime,
        userStats: (result as any).rows?.[0] || (result as any)[0] || {},
      },
    };

  } catch (error) {
    return {
      service: "database",
      status: "critical",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Database connection failed",
      details: {
        connectionPool: "failed",
      },
    };
  }
}

/**
 * Check email service health
 */
async function checkEmailServiceHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      return {
        service: "email",
        status: "critical",
        responseTime: Date.now() - startTime,
        error: "Email service API key not configured",
      };
    }

    // Test Resend API connectivity
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        service: "email",
        status: "critical",
        responseTime,
        error: `Resend API returned ${response.status}: ${response.statusText}`,
      };
    }

    // Check response time
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (responseTime > 5000) {
      status = "critical";
    } else if (responseTime > 2000) {
      status = "warning";
    }

    return {
      service: "email",
      status,
      responseTime,
      details: {
        provider: "resend",
        apiStatus: response.status,
      },
    };

  } catch (error) {
    return {
      service: "email",
      status: "critical",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Email service check failed",
    };
  }
}

/**
 * Check performance monitoring health
 */
async function checkPerformanceHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const performanceHealth = getPerformanceHealth();
    const responseTime = Date.now() - startTime;

    return {
      service: "performance_monitor",
      status: performanceHealth.status,
      responseTime,
      details: performanceHealth.details,
    };

  } catch (error) {
    return {
      service: "performance_monitor",
      status: "warning",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Performance monitoring check failed",
    };
  }
}

/**
 * Check cache system health
 */
async function checkCacheHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const cacheHealth = getCacheHealth();
    const responseTime = Date.now() - startTime;

    return {
      service: "cache_system",
      status: cacheHealth.status,
      responseTime,
      details: cacheHealth,
    };

  } catch (error) {
    return {
      service: "cache_system",
      status: "warning",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Cache system check failed",
    };
  }
}

/**
 * Check Sentry monitoring health
 */
async function checkSentryMonitoringHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const sentryHealth = await checkSentryHealth();
    const responseTime = Date.now() - startTime;

    let status: "healthy" | "warning" | "critical" = "healthy";
    
    if (!sentryHealth.configured) {
      status = "warning"; // Not critical since it's monitoring
    } else if (!sentryHealth.connected) {
      status = "warning"; // Monitoring issues shouldn't fail health check
    }

    return {
      service: "sentry_monitoring",
      status,
      responseTime,
      details: {
        configured: sentryHealth.configured,
        connected: sentryHealth.connected,
        lastEventSent: sentryHealth.lastEventSent,
        errors: sentryHealth.errors,
      },
      error: sentryHealth.errors?.length ? sentryHealth.errors.join(", ") : undefined,
    };

  } catch (error) {
    return {
      service: "sentry_monitoring",
      status: "warning",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Sentry monitoring check failed",
    };
  }
}

/**
 * Check external service dependencies
 */
async function checkExternalDependencies(): Promise<HealthCheckResult[]> {
  const checks: HealthCheckResult[] = [];
  
  // Check Neon Database (external service)
  const neonCheck = await checkNeonDatabaseService();
  checks.push(neonCheck);

  return checks;
}

/**
 * Check Neon database service health
 */
async function checkNeonDatabaseService(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Extract database URL info for health check
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return {
        service: "neon_database",
        status: "critical",
        responseTime: Date.now() - startTime,
        error: "Database URL not configured",
      };
    }

    // Test connection with a simple query
    const result = await db.execute(sql`SELECT NOW() as server_time`);
    const responseTime = Date.now() - startTime;

    // Check response time for external service
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (responseTime > 2000) {
      status = "critical";
    } else if (responseTime > 1000) {
      status = "warning";
    }

    return {
      service: "neon_database",
      status,
      responseTime,
      details: {
        serverTime: (result as any)[0]?.server_time,
        connectionLatency: responseTime,
      },
    };

  } catch (error) {
    return {
      service: "neon_database",
      status: "critical",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Neon database service check failed",
    };
  }
}