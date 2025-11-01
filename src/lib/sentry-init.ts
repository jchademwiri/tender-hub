/**
 * Sentry initialization for production environment
 * This file sets up comprehensive error tracking, performance monitoring,
 * and alerting for the Tender Hub application.
 */

import { initializeSentryProduction, checkSentryHealth } from "./sentry-utils";
import { initializeSentryAlerting } from "./sentry-alerting";
import { initializeSentryMiddleware } from "./sentry-middleware";
import { sentryConfig } from "./env-validation";

/**
 * Initialize all Sentry systems for production
 */
export async function initializeSentry(): Promise<void> {
  try {
    // Check if Sentry is configured
    if (!sentryConfig.dsn && !sentryConfig.publicDsn) {
      console.warn("Sentry not configured, skipping initialization");
      return;
    }

    console.log("Initializing Sentry for production...");

    // Initialize core Sentry functionality
    initializeSentryProduction();

    // Initialize alerting system (server-side only)
    if (typeof window === "undefined") {
      initializeSentryAlerting();
    }

    // Initialize middleware tracking
    initializeSentryMiddleware();

    // Perform health check
    const health = await checkSentryHealth();
    
    if (health.configured && health.connected) {
      console.log("✅ Sentry initialized successfully", {
        environment: sentryConfig.environment,
        release: sentryConfig.release,
        alerting: {
          email: !!sentryConfig.alerting.email,
          webhook: !!sentryConfig.alerting.webhook,
        },
      });
    } else {
      console.error("❌ Sentry initialization failed", health.errors);
    }

  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

/**
 * Get Sentry initialization status
 */
export async function getSentryStatus(): Promise<{
  initialized: boolean;
  configured: boolean;
  connected: boolean;
  features: {
    errorTracking: boolean;
    performanceMonitoring: boolean;
    sessionReplay: boolean;
    alerting: boolean;
    middleware: boolean;
  };
  health?: Awaited<ReturnType<typeof checkSentryHealth>>;
}> {
  const configured = !!(sentryConfig.dsn || sentryConfig.publicDsn);
  
  if (!configured) {
    return {
      initialized: false,
      configured: false,
      connected: false,
      features: {
        errorTracking: false,
        performanceMonitoring: false,
        sessionReplay: false,
        alerting: false,
        middleware: false,
      },
    };
  }

  try {
    const health = await checkSentryHealth();
    
    return {
      initialized: true,
      configured: health.configured,
      connected: health.connected,
      features: {
        errorTracking: true,
        performanceMonitoring: sentryConfig.tracesSampleRate > 0,
        sessionReplay: sentryConfig.replaysSessionSampleRate > 0 || sentryConfig.replaysOnErrorSampleRate > 0,
        alerting: !!(sentryConfig.alerting.email || sentryConfig.alerting.webhook),
        middleware: true,
      },
      health,
    };
  } catch (error) {
    return {
      initialized: false,
      configured: true,
      connected: false,
      features: {
        errorTracking: false,
        performanceMonitoring: false,
        sessionReplay: false,
        alerting: false,
        middleware: false,
      },
    };
  }
}

/**
 * Validate Sentry configuration for production
 */
export function validateSentryConfig(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required configuration
  if (!sentryConfig.dsn && !sentryConfig.publicDsn) {
    errors.push("No Sentry DSN configured");
  }

  if (sentryConfig.environment === "production") {
    // Production-specific validations
    if (!sentryConfig.org) {
      warnings.push("SENTRY_ORG not configured - source map uploads will not work");
    }

    if (!sentryConfig.project) {
      warnings.push("SENTRY_PROJECT not configured - source map uploads will not work");
    }

    if (!sentryConfig.authToken) {
      warnings.push("SENTRY_AUTH_TOKEN not configured - source map uploads will not work");
    }

    if (!sentryConfig.alerting.email && !sentryConfig.alerting.webhook) {
      warnings.push("No alerting channels configured - critical errors may go unnoticed");
    }

    if (sentryConfig.tracesSampleRate > 0.2) {
      warnings.push("High traces sample rate may impact performance in production");
    }

    if (sentryConfig.replaysSessionSampleRate > 0.1) {
      warnings.push("High session replay sample rate may impact performance and storage costs");
    }

    if (sentryConfig.debug) {
      warnings.push("Debug mode is enabled in production - this may impact performance");
    }
  }

  // Check sample rates
  if (sentryConfig.tracesSampleRate < 0 || sentryConfig.tracesSampleRate > 1) {
    errors.push("SENTRY_TRACES_SAMPLE_RATE must be between 0 and 1");
  }

  if (sentryConfig.replaysSessionSampleRate < 0 || sentryConfig.replaysSessionSampleRate > 1) {
    errors.push("SENTRY_REPLAYS_SESSION_SAMPLE_RATE must be between 0 and 1");
  }

  if (sentryConfig.replaysOnErrorSampleRate < 0 || sentryConfig.replaysOnErrorSampleRate > 1) {
    errors.push("SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE must be between 0 and 1");
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Auto-initialize Sentry if running in a supported environment
 */
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  // Server-side initialization
  initializeSentry().catch(error => {
    console.error("Failed to auto-initialize Sentry:", error);
  });
} else if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
  // Client-side initialization
  initializeSentry().catch(error => {
    console.error("Failed to auto-initialize Sentry on client:", error);
  });
}