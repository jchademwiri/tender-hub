import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./src/lib/env-validation";

Sentry.init({
  dsn: sentryConfig.dsn,
  
  // Environment configuration
  environment: sentryConfig.environment,
  
  // Performance monitoring for edge runtime (lower sample rate)
  tracesSampleRate: sentryConfig.environment === "production" ? 0.05 : sentryConfig.tracesSampleRate,
  
  // Edge-specific configuration
  beforeSend(event, hint) {
    // Filter out sensitive information in edge runtime
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't send edge runtime specific errors that are not actionable
      if (error instanceof Error && error.message.includes("edge runtime")) {
        return null;
      }
    }
    
    // Filter out sensitive request data
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
    }
    
    return event;
  },
  
  // Release tracking
  release: sentryConfig.release,
  
  // Debug mode for development
  debug: sentryConfig.debug,
  
  // Edge runtime specific settings
  maxBreadcrumbs: 25, // Lower for edge runtime
  attachStacktrace: true,
  sendDefaultPii: false,
  
  // Edge-specific error ignoring
  ignoreErrors: [
    "Edge runtime error",
    "Middleware error",
  ],
  
  // Tags for edge runtime
  initialScope: {
    tags: {
      component: "edge",
      service: "tender-hub",
    },
  },
});