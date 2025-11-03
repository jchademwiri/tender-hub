import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./env-validation";

/**
 * Sentry alerting and notification system for production monitoring
 */

export interface AlertContext {
  errorCount: number;
  timeWindow: string;
  environment: string;
  release: string;
  affectedUsers?: number;
  errorRate?: number;
  performanceImpact?: {
    averageResponseTime: number;
    slowestEndpoint: string;
  };
}

export interface AlertRule {
  name: string;
  condition: (context: AlertContext) => boolean;
  severity: "low" | "medium" | "high" | "critical";
  cooldown: number; // minutes
  channels: ("email" | "webhook" | "sentry")[];
}

/**
 * Predefined alert rules for production monitoring
 */
export const ALERT_RULES: AlertRule[] = [
  {
    name: "High Error Rate",
    condition: (ctx) => ctx.errorRate !== undefined && ctx.errorRate > 0.05, // 5% error rate
    severity: "high",
    cooldown: 15,
    channels: ["email", "webhook", "sentry"],
  },
  {
    name: "Critical Error Spike",
    condition: (ctx) => ctx.errorCount > sentryConfig.alerting.errorThreshold,
    severity: "critical",
    cooldown: 5,
    channels: ["email", "webhook", "sentry"],
  },
  {
    name: "Performance Degradation",
    condition: (ctx) => 
      ctx.performanceImpact !== undefined && 
      ctx.performanceImpact.averageResponseTime > sentryConfig.alerting.performanceThreshold,
    severity: "medium",
    cooldown: 30,
    channels: ["webhook", "sentry"],
  },
  {
    name: "Database Connection Issues",
    condition: (ctx) => ctx.errorCount > 5 && ctx.timeWindow === "5m",
    severity: "high",
    cooldown: 10,
    channels: ["email", "webhook", "sentry"],
  },
  {
    name: "Authentication Failures",
    condition: (ctx) => ctx.errorCount > 10 && ctx.timeWindow === "10m",
    severity: "medium",
    cooldown: 20,
    channels: ["webhook", "sentry"],
  },
];

/**
 * Alert cooldown tracking
 */
const alertCooldowns = new Map<string, number>();

/**
 * Check if alert is in cooldown period
 */
function isInCooldown(ruleName: string, cooldownMinutes: number): boolean {
  const lastAlert = alertCooldowns.get(ruleName);
  if (!lastAlert) return false;
  
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return Date.now() - lastAlert < cooldownMs;
}

/**
 * Set alert cooldown
 */
function setCooldown(ruleName: string): void {
  alertCooldowns.set(ruleName, Date.now());
}

/**
 * Send email alert
 */
async function sendEmailAlert(rule: AlertRule, context: AlertContext): Promise<void> {
  if (!sentryConfig.alerting.email) {
    console.warn("Email alerting configured but no email address provided");
    return;
  }

  try {
    // This would integrate with your email service (Resend)
    // For now, we'll log the alert details
    console.error(`EMAIL ALERT [${rule.severity.toUpperCase()}]: ${rule.name}`, {
      context,
      timestamp: new Date().toISOString(),
      recipient: sentryConfig.alerting.email,
    });

    // TODO: Integrate with actual email service
    // await emailService.sendAlert({
    //   to: sentryConfig.alerting.email,
    //   subject: `[${rule.severity.toUpperCase()}] ${rule.name} - Tender Hub`,
    //   template: 'error-alert',
    //   data: { rule, context }
    // });
  } catch (error) {
    console.error("Failed to send email alert:", error);
  }
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(rule: AlertRule, context: AlertContext): Promise<void> {
  if (!sentryConfig.alerting.webhook) {
    console.warn("Webhook alerting configured but no webhook URL provided");
    return;
  }

  try {
    const payload = {
      alert: {
        name: rule.name,
        severity: rule.severity,
        timestamp: new Date().toISOString(),
        environment: context.environment,
        release: context.release,
      },
      context,
      metadata: {
        service: "tender-hub",
        version: sentryConfig.release,
      },
    };

    const response = await fetch(sentryConfig.alerting.webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `tender-hub-alerts/${sentryConfig.release}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }

    console.log(`Webhook alert sent successfully for: ${rule.name}`);
  } catch (error) {
    console.error("Failed to send webhook alert:", error);
  }
}

/**
 * Send Sentry alert (create issue or add comment)
 */
async function sendSentryAlert(rule: AlertRule, context: AlertContext): Promise<void> {
  try {
    Sentry.withScope((scope) => {
      scope.setLevel(rule.severity === "critical" ? "fatal" : "error");
      scope.setTag("alert_rule", rule.name);
      scope.setTag("alert_severity", rule.severity);
      scope.setContext("alert_context", context as any);
      
      Sentry.captureMessage(`Alert triggered: ${rule.name}`, rule.severity === "critical" ? "fatal" : "error");
    });

    console.log(`Sentry alert sent for: ${rule.name}`);
  } catch (error) {
    console.error("Failed to send Sentry alert:", error);
  }
}

/**
 * Process alert rule and send notifications
 */
async function processAlert(rule: AlertRule, context: AlertContext): Promise<void> {
  // Check cooldown
  if (isInCooldown(rule.name, rule.cooldown)) {
    console.log(`Alert ${rule.name} is in cooldown, skipping`);
    return;
  }

  // Check condition
  if (!rule.condition(context)) {
    return;
  }

  console.warn(`Alert triggered: ${rule.name} [${rule.severity}]`, context);

  // Set cooldown
  setCooldown(rule.name);

  // Send notifications based on configured channels
  const notifications = rule.channels.map(async (channel) => {
    switch (channel) {
      case "email":
        return sendEmailAlert(rule, context);
      case "webhook":
        return sendWebhookAlert(rule, context);
      case "sentry":
        return sendSentryAlert(rule, context);
      default:
        console.warn(`Unknown alert channel: ${channel}`);
    }
  });

  // Wait for all notifications to complete
  await Promise.allSettled(notifications);
}

/**
 * Check all alert rules against current context
 */
export async function checkAlerts(context: AlertContext): Promise<void> {
  if (!sentryConfig.dsn) {
    // Sentry not configured, skip alerting
    return;
  }

  try {
    const alertPromises = ALERT_RULES.map(rule => processAlert(rule, context));
    await Promise.allSettled(alertPromises);
  } catch (error) {
    console.error("Error processing alerts:", error);
  }
}

/**
 * Create alert context from error metrics
 */
export function createAlertContext(metrics: {
  errorCount: number;
  timeWindow: string;
  totalRequests?: number;
  affectedUsers?: number;
  averageResponseTime?: number;
  slowestEndpoint?: string;
}): AlertContext {
  const errorRate = metrics.totalRequests ? metrics.errorCount / metrics.totalRequests : undefined;
  
  return {
    errorCount: metrics.errorCount,
    timeWindow: metrics.timeWindow,
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    affectedUsers: metrics.affectedUsers,
    errorRate,
    performanceImpact: metrics.averageResponseTime ? {
      averageResponseTime: metrics.averageResponseTime,
      slowestEndpoint: metrics.slowestEndpoint || "unknown",
    } : undefined,
  };
}

/**
 * Monitor error patterns and trigger alerts
 */
export class ErrorMonitor {
  private errorCounts = new Map<string, number>();
  private timeWindows = new Map<string, number>();
  private readonly WINDOW_SIZE = 5 * 60 * 1000; // 5 minutes

  /**
   * Record an error occurrence
   */
  recordError(errorType: string, userId?: string): void {
    const now = Date.now();
    const windowKey = `${errorType}_${Math.floor(now / this.WINDOW_SIZE)}`;
    
    // Increment error count for this window
    this.errorCounts.set(windowKey, (this.errorCounts.get(windowKey) || 0) + 1);
    this.timeWindows.set(windowKey, now);
    
    // Clean up old windows
    this.cleanupOldWindows();
    
    // Check if we should trigger alerts
    this.checkErrorThresholds(errorType);
  }

  /**
   * Clean up old time windows
   */
  private cleanupOldWindows(): void {
    const now = Date.now();
    const cutoff = now - (this.WINDOW_SIZE * 3); // Keep 3 windows
    
    for (const [key, timestamp] of this.timeWindows.entries()) {
      if (timestamp < cutoff) {
        this.errorCounts.delete(key);
        this.timeWindows.delete(key);
      }
    }
  }

  /**
   * Check if error thresholds are exceeded
   */
  private async checkErrorThresholds(errorType: string): Promise<void> {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.WINDOW_SIZE);
    const windowKey = `${errorType}_${currentWindow}`;
    
    const errorCount = this.errorCounts.get(windowKey) || 0;
    
    if (errorCount > 0) {
      const context = createAlertContext({
        errorCount,
        timeWindow: "5m",
      });
      
      await checkAlerts(context);
    }
  }

  /**
   * Get current error statistics
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const [key, count] of this.errorCounts.entries()) {
      const [errorType] = key.split("_");
      stats[errorType] = (stats[errorType] || 0) + count;
    }
    
    return stats;
  }
}

/**
 * Global error monitor instance
 */
export const errorMonitor = new ErrorMonitor();

/**
 * Initialize Sentry alerting system
 */
export function initializeSentryAlerting(): void {
  if (!sentryConfig.dsn) {
    console.warn("Sentry not configured, alerting system disabled");
    return;
  }

  console.log("Sentry alerting system initialized", {
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    alertRules: ALERT_RULES.length,
    emailAlerting: !!sentryConfig.alerting.email,
    webhookAlerting: !!sentryConfig.alerting.webhook,
  });

  // Set up periodic health checks
  if (typeof window === "undefined") {
    // Server-side only
    setInterval(async () => {
      const stats = errorMonitor.getErrorStats();
      const totalErrors = Object.values(stats).reduce((sum, count) => sum + count, 0);
      
      if (totalErrors > 0) {
        const context = createAlertContext({
          errorCount: totalErrors,
          timeWindow: "5m",
        });
        
        await checkAlerts(context);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

/**
 * Test alert system (for development/testing)
 */
export async function testAlerts(): Promise<void> {
  if (sentryConfig.environment === "production") {
    console.warn("Cannot test alerts in production environment");
    return;
  }

  console.log("Testing alert system...");

  const testContext = createAlertContext({
    errorCount: sentryConfig.alerting.errorThreshold + 1,
    timeWindow: "5m",
    totalRequests: 100,
    affectedUsers: 5,
    averageResponseTime: sentryConfig.alerting.performanceThreshold + 100,
    slowestEndpoint: "/api/test",
  });

  await checkAlerts(testContext);
  console.log("Alert test completed");
}