import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-utils";
import { withErrorHandler, createSuccessResponse } from "@/lib/api-error-handler";
import { errorMonitor } from "@/lib/sentry-alerting";
import { getSentryInfo } from "@/lib/sentry-utils";
import { AuditLogger } from "@/lib/audit-logger";

interface MonitoringMetrics {
  systemHealth: {
    status: "healthy" | "warning" | "critical";
    uptime: number;
    services: Array<{
      name: string;
      status: "healthy" | "warning" | "critical";
      responseTime: number;
      details?: any;
    }>;
  };
  performance: {
    apiResponseTime: number;
    databaseResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
    errorRate: number;
  };
  errors: {
    total: number;
    last24h: number;
    byType: Record<string, number>;
    sentryStatus: any;
  };
  alerts: {
    active: number;
    resolved: number;
    configuration: any;
  };
}

async function monitoringHandler(request: NextRequest) {
  // Ensure user has admin access
  const user = await requireAdmin();

  try {
    // Collect monitoring metrics
    const metrics = await collectMonitoringMetrics();

    // Log monitoring access
    await AuditLogger.logSystemAccess(user.user.id, "monitoring_access", {
      metadata: {
        endpoint: "/api/admin/monitoring",
        timestamp: new Date().toISOString(),
      },
    });

    return createSuccessResponse(metrics);
  } catch (error) {
    console.error("Failed to collect monitoring metrics:", error);
    throw error;
  }
}

async function collectMonitoringMetrics(): Promise<MonitoringMetrics> {
  // Collect system health metrics
  const systemHealth = await collectSystemHealthMetrics();
  
  // Collect performance metrics
  const performance = await collectPerformanceMetrics();
  
  // Collect error metrics
  const errors = await collectErrorMetrics();
  
  // Collect alert metrics
  const alerts = await collectAlertMetrics();

  return {
    systemHealth,
    performance,
    errors,
    alerts,
  };
}

async function collectSystemHealthMetrics(): Promise<MonitoringMetrics['systemHealth']> {
  try {
    // Test database connectivity
    const dbStartTime = Date.now();
    await db.execute(sql`SELECT 1 as health_check`);
    const dbResponseTime = Date.now() - dbStartTime;

    // Test email service (simplified check)
    const emailStartTime = Date.now();
    const emailHealthy = !!process.env.RESEND_API_KEY;
    const emailResponseTime = Date.now() - emailStartTime;

    const services: Array<{
      name: string;
      status: "healthy" | "warning" | "critical";
      responseTime: number;
      details?: any;
    }> = [
      {
        name: "Database",
        status: (dbResponseTime > 1000 ? "critical" : dbResponseTime > 500 ? "warning" : "healthy") as "healthy" | "warning" | "critical",
        responseTime: dbResponseTime,
        details: {
          connectionPool: "active",
          queryTime: dbResponseTime,
        },
      },
      {
        name: "Email Service",
        status: (emailHealthy ? "healthy" : "critical") as "healthy" | "warning" | "critical",
        responseTime: emailResponseTime,
        details: {
          provider: "resend",
          configured: emailHealthy,
        },
      },
    ];

    const criticalCount = services.filter(s => s.status === "critical").length;
    const warningCount = services.filter(s => s.status === "warning").length;

    return {
      status: criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy" as const,
      uptime: process.uptime(),
      services,
    };
  } catch (error) {
    return {
      status: "critical" as const,
      uptime: 0,
      services: [
        {
          name: "System",
          status: "critical" as const,
          responseTime: 0,
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      ],
    };
  }
}

async function collectPerformanceMetrics() {
  try {
    // Database performance test
    const dbStartTime = Date.now();
    await db.execute(sql`SELECT COUNT(*) FROM "user"`);
    const databaseResponseTime = Date.now() - dbStartTime;

    // Simulated metrics (in a real implementation, these would come from monitoring tools)
    return {
      apiResponseTime: Math.random() * 300 + 50, // Simulated
      databaseResponseTime,
      memoryUsage: Math.random() * 80 + 20, // Simulated percentage
      cpuUsage: Math.random() * 60 + 10, // Simulated percentage
      cacheHitRate: Math.random() * 20 + 80, // Simulated percentage
      errorRate: Math.random() * 2, // Simulated percentage
    };
  } catch (error) {
    return {
      apiResponseTime: 0,
      databaseResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      cacheHitRate: 0,
      errorRate: 100,
    };
  }
}

async function collectErrorMetrics() {
  const errorStats = errorMonitor.getErrorStats();
  const sentryInfo = getSentryInfo();
  
  const total = Object.values(errorStats).reduce((sum, count) => sum + count, 0);
  
  return {
    total,
    last24h: total, // Simplified - in real implementation, this would be time-based
    byType: errorStats,
    sentryStatus: sentryInfo,
  };
}

async function collectAlertMetrics() {
  // In a real implementation, this would fetch from your alerting system
  return {
    active: Math.random() > 0.8 ? 1 : 0, // Simulated
    resolved: Math.floor(Math.random() * 5), // Simulated
    configuration: {
      emailEnabled: !!process.env.SENTRY_ALERT_EMAIL,
      webhookEnabled: !!process.env.SENTRY_ALERT_WEBHOOK,
      rulesCount: 5,
    },
  };
}

export const GET = withErrorHandler(monitoringHandler);