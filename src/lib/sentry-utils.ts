import * as Sentry from "@sentry/nextjs";
import type { User } from "@/db/schema";
import { errorMonitor } from "./sentry-alerting";
import { sentryConfig } from "./env-validation";

/**
 * Sentry utility functions for error tracking and monitoring
 */

export interface ErrorContext {
  userId?: string;
  userRole?: string;
  endpoint?: string;
  action?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: Partial<User>) {
  Sentry.setUser({
    id: user.id,
    username: user.name || undefined,
    // Don't include email for privacy
    role: user.role,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Set additional context for error tracking
 */
export function setSentryContext(context: ErrorContext) {
  // Set user context if provided
  if (context.userId) {
    Sentry.setUser({
      id: context.userId,
      role: context.userRole,
    });
  }
  
  // Set tags
  if (context.tags) {
    Sentry.setTags(context.tags);
  }
  
  // Set additional context
  Sentry.setContext("error_context", {
    endpoint: context.endpoint,
    action: context.action,
    metadata: context.metadata,
  });
}

/**
 * Track API errors with context
 */
export function trackAPIError(
  error: Error,
  context: {
    endpoint: string;
    method: string;
    statusCode?: number;
    userId?: string;
    userRole?: string;
    requestId?: string;
  }
) {
  Sentry.withScope((scope) => {
    // Set error level based on status code
    if (context.statusCode) {
      if (context.statusCode >= 500) {
        scope.setLevel("error");
      } else if (context.statusCode >= 400) {
        scope.setLevel("warning");
      }
    }
    
    // Set tags
    scope.setTags({
      endpoint: context.endpoint,
      method: context.method,
      statusCode: context.statusCode?.toString() || "unknown",
    });
    
    // Set user context
    if (context.userId) {
      scope.setUser({
        id: context.userId,
        role: context.userRole,
      });
    }
    
    // Set additional context
    scope.setContext("api_error", {
      endpoint: context.endpoint,
      method: context.method,
      statusCode: context.statusCode,
      requestId: context.requestId,
    });
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      message: `API Error: ${context.method} ${context.endpoint}`,
      category: "api",
      level: "error",
      data: {
        statusCode: context.statusCode,
        requestId: context.requestId,
      },
    });
    
    Sentry.captureException(error);
    
    // Record error for alerting system
    errorMonitor.recordError(`api_${context.statusCode || 'unknown'}`, context.userId);
  });
}

/**
 * Track database errors
 */
export function trackDatabaseError(
  error: Error,
  context: {
    query?: string;
    operation: string;
    table?: string;
    userId?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel("error");
    
    // Set tags
    scope.setTags({
      error_type: "database",
      operation: context.operation,
      table: context.table || "unknown",
    });
    
    // Set user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Set context (without sensitive query data)
    scope.setContext("database_error", {
      operation: context.operation,
      table: context.table,
      // Don't include the actual query to avoid sensitive data
      hasQuery: !!context.query,
    });
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      message: `Database Error: ${context.operation}`,
      category: "database",
      level: "error",
      data: {
        operation: context.operation,
        table: context.table,
      },
    });
    
    Sentry.captureException(error);
    
    // Record error for alerting system
    errorMonitor.recordError(`database_${context.operation}`, context.userId);
  });
}

/**
 * Track authentication errors
 */
export function trackAuthError(
  error: Error,
  context: {
    action: "login" | "register" | "logout" | "token_refresh" | "password_reset";
    userId?: string;
    email?: string; // Will be filtered out in beforeSend
    ipAddress?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    
    // Set tags
    scope.setTags({
      error_type: "authentication",
      auth_action: context.action,
    });
    
    // Set context (email will be filtered out by beforeSend)
    scope.setContext("auth_error", {
      action: context.action,
      userId: context.userId,
      hasEmail: !!context.email,
      ipAddress: context.ipAddress,
    });
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      message: `Auth Error: ${context.action}`,
      category: "auth",
      level: "warning",
      data: {
        action: context.action,
        userId: context.userId,
      },
    });
    
    Sentry.captureException(error);
    
    // Record error for alerting system
    errorMonitor.recordError(`auth_${context.action}`, context.userId);
  });
}

/**
 * Track business logic errors
 */
export function trackBusinessError(
  error: Error,
  context: {
    feature: string;
    action: string;
    userId?: string;
    userRole?: string;
    metadata?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel("error");
    
    // Set tags
    scope.setTags({
      error_type: "business_logic",
      feature: context.feature,
      action: context.action,
    });
    
    // Set user context
    if (context.userId) {
      scope.setUser({
        id: context.userId,
        role: context.userRole,
      });
    }
    
    // Set context
    scope.setContext("business_error", {
      feature: context.feature,
      action: context.action,
      metadata: context.metadata,
    });
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      message: `Business Error: ${context.feature} - ${context.action}`,
      category: "business",
      level: "error",
      data: {
        feature: context.feature,
        action: context.action,
      },
    });
    
    Sentry.captureException(error);
  });
}

/**
 * Track performance issues
 */
export function trackPerformanceIssue(
  message: string,
  context: {
    operation: string;
    duration: number;
    threshold: number;
    userId?: string;
    metadata?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    
    // Set tags
    scope.setTags({
      issue_type: "performance",
      operation: context.operation,
    });
    
    // Set user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Set context
    scope.setContext("performance_issue", {
      operation: context.operation,
      duration: context.duration,
      threshold: context.threshold,
      metadata: context.metadata,
    });
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      message: `Performance Issue: ${context.operation}`,
      category: "performance",
      level: "warning",
      data: {
        operation: context.operation,
        duration: context.duration,
        threshold: context.threshold,
      },
    });
    
    Sentry.captureMessage(message, "warning");
  });
}

/**
 * Track custom events
 */
export function trackCustomEvent(
  message: string,
  context: {
    category: string;
    level?: "info" | "warning" | "error";
    userId?: string;
    tags?: Record<string, string>;
    metadata?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel(context.level || "info");
    
    // Set tags
    if (context.tags) {
      scope.setTags(context.tags);
    }
    
    // Set user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Set context
    scope.setContext("custom_event", {
      category: context.category,
      metadata: context.metadata,
    });
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      message,
      category: context.category,
      level: context.level || "info",
      data: context.metadata,
    });
    
    Sentry.captureMessage(message, context.level || "info");
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startSentryTransaction(
  name: string,
  operation: string,
  context?: {
    userId?: string;
    tags?: Record<string, string>;
    metadata?: Record<string, any>;
  }
) {
  // Start span for performance monitoring
  return Sentry.startSpan({
    name,
    op: operation,
    attributes: context?.tags || {},
  }, () => {
    // Set user context if provided
    if (context?.userId) {
      Sentry.setUser({ id: context.userId });
    }
    return null; // Return null as we're just setting up context
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: "info" | "warning" | "error" = "info",
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Flush Sentry events (useful for serverless environments)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return await Sentry.flush(timeout);
}

/**
 * Check if Sentry is properly configured
 */
export function isSentryConfigured(): boolean {
  return !!(sentryConfig.dsn || sentryConfig.publicDsn);
}

/**
 * Get current Sentry configuration info
 */
export function getSentryInfo() {
  return {
    configured: isSentryConfigured(),
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    dsn: sentryConfig.dsn ? "[CONFIGURED]" : "[NOT_CONFIGURED]",
    publicDsn: sentryConfig.publicDsn ? "[CONFIGURED]" : "[NOT_CONFIGURED]",
    alerting: {
      email: sentryConfig.alerting.email ? "[CONFIGURED]" : "[NOT_CONFIGURED]",
      webhook: sentryConfig.alerting.webhook ? "[CONFIGURED]" : "[NOT_CONFIGURED]",
      errorThreshold: sentryConfig.alerting.errorThreshold,
      performanceThreshold: sentryConfig.alerting.performanceThreshold,
    },
    sampling: {
      traces: sentryConfig.tracesSampleRate,
      replaysSession: sentryConfig.replaysSessionSampleRate,
      replaysOnError: sentryConfig.replaysOnErrorSampleRate,
    },
  };
}

/**
 * Middleware wrapper for automatic error tracking
 */
export function withSentryErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  context: {
    operation: string;
    feature?: string;
    userId?: string;
  }
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          trackBusinessError(error, {
            feature: context.feature || "unknown",
            action: context.operation,
            userId: context.userId,
          });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      trackBusinessError(error as Error, {
        feature: context.feature || "unknown",
        action: context.operation,
        userId: context.userId,
      });
      throw error;
    }
  }) as T;
}

/**
 * Set up user context with privacy filtering
 */
export function setUserContextSafe(user: Partial<User & { ipAddress?: string }>) {
  Sentry.setUser({
    id: user.id,
    username: user.name || undefined,
    // Don't include email or IP address for privacy
    role: user.role,
    // Add non-PII metadata
    metadata: {
      hasEmail: !!user.email,
      createdAt: user.createdAt?.toISOString(),
      // lastLoginAt: user.lastLoginAt?.toISOString(), // Property doesn't exist
    },
  });
}

/**
 * Track feature usage for analytics
 */
export function trackFeatureUsage(
  feature: string,
  action: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  Sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setTag("event_type", "feature_usage");
    scope.setTag("feature", feature);
    scope.setTag("action", action);
    
    if (userId) {
      scope.setUser({ id: userId });
    }
    
    scope.setContext("feature_usage", {
      feature,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.addBreadcrumb({
      message: `Feature used: ${feature} - ${action}`,
      category: "feature",
      level: "info",
      data: { feature, action, ...metadata },
    });
    
    Sentry.captureMessage(`Feature usage: ${feature} - ${action}`, "info");
  });
}

/**
 * Track security events
 */
export function trackSecurityEvent(
  event: "suspicious_login" | "rate_limit_exceeded" | "unauthorized_access" | "data_breach_attempt",
  context: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    details?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    scope.setTag("event_type", "security");
    scope.setTag("security_event", event);
    
    // Set context without sensitive data
    scope.setContext("security_event", {
      event,
      endpoint: context.endpoint,
      hasUserId: !!context.userId,
      hasIpAddress: !!context.ipAddress,
      timestamp: new Date().toISOString(),
      details: context.details,
    });
    
    Sentry.addBreadcrumb({
      message: `Security event: ${event}`,
      category: "security",
      level: "warning",
      data: {
        event,
        endpoint: context.endpoint,
      },
    });
    
    Sentry.captureMessage(`Security event: ${event}`, "warning");
    
    // Record for alerting system
    errorMonitor.recordError(`security_${event}`, context.userId);
  });
}

/**
 * Track business metrics
 */
export function trackBusinessMetric(
  metric: string,
  value: number,
  unit: string,
  context?: {
    userId?: string;
    tags?: Record<string, string>;
    metadata?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setTag("event_type", "business_metric");
    scope.setTag("metric", metric);
    scope.setTag("unit", unit);
    
    if (context?.tags) {
      scope.setTags(context.tags);
    }
    
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    scope.setContext("business_metric", {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata: context?.metadata,
    });
    
    Sentry.addBreadcrumb({
      message: `Business metric: ${metric} = ${value} ${unit}`,
      category: "business",
      level: "info",
      data: { metric, value, unit },
    });
    
    Sentry.captureMessage(`Business metric: ${metric} = ${value} ${unit}`, "info");
  });
}

/**
 * Initialize Sentry with production configuration
 */
export function initializeSentryProduction() {
  if (!isSentryConfigured()) {
    console.warn("Sentry not configured, skipping initialization");
    return;
  }

  // Set global tags
  Sentry.setTags({
    service: "tender-hub",
    version: sentryConfig.release,
    environment: sentryConfig.environment,
    server: sentryConfig.serverName || "unknown",
  });

  // Set global context
  Sentry.setContext("application", {
    name: "Tender Hub",
    version: sentryConfig.release,
    environment: sentryConfig.environment,
    build: process.env.BUILD_ID || "unknown",
    deployment: process.env.DEPLOYMENT_ID || "unknown",
  });

  console.log("Sentry initialized for production", getSentryInfo());
}

/**
 * Health check for Sentry integration
 */
export async function checkSentryHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  lastEventSent?: string;
  errors?: string[];
}> {
  const errors: string[] = [];
  
  if (!isSentryConfigured()) {
    errors.push("Sentry DSN not configured");
    return { configured: false, connected: false, errors };
  }

  try {
    // Test Sentry connection by sending a test message
    const eventId = Sentry.captureMessage("Sentry health check", "info");
    
    // Flush to ensure the event is sent
    const flushed = await flushSentry(5000);
    
    return {
      configured: true,
      connected: flushed,
      lastEventSent: eventId || undefined,
      errors: flushed ? [] : ["Failed to flush events to Sentry"],
    };
  } catch (error) {
    errors.push(`Sentry connection error: ${error instanceof Error ? error.message : String(error)}`);
    return { configured: true, connected: false, errors };
  }
}