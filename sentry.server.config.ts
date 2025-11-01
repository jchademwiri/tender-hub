import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./src/lib/env-validation";

Sentry.init({
  dsn: sentryConfig.dsn,
  
  // Environment configuration
  environment: sentryConfig.environment,
  
  // Performance monitoring
  tracesSampleRate: sentryConfig.tracesSampleRate,
  
  // Server-specific configuration
  serverName: sentryConfig.serverName || "tender-hub-server",
  
  // Error filtering for server-side
  beforeSend(event, hint) {
    // Filter out sensitive server information
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't send database credential errors
      if (error instanceof Error && error.message.includes("DATABASE_URL")) {
        return null;
      }
      
      // Filter out API key errors
      if (error instanceof Error && error.message.includes("API_KEY")) {
        return null;
      }
      
      // Filter out sensitive stack traces
      if (event.exception.values) {
        event.exception.values.forEach(exception => {
          if (exception.stacktrace?.frames) {
            exception.stacktrace.frames.forEach(frame => {
              // Remove sensitive file paths
              if (frame.filename) {
                frame.filename = frame.filename.replace(
                  /\/home\/[^\/]+/g,
                  "/home/[USER]"
                );
              }
              
              // Remove environment variables from context
              if (frame.vars) {
                Object.keys(frame.vars).forEach(key => {
                  if (key.includes("PASSWORD") || key.includes("SECRET") || key.includes("KEY")) {
                    frame.vars![key] = "[FILTERED]";
                  }
                });
              }
            });
          }
        });
      }
    }
    
    // Filter out sensitive request data
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-api-key"];
      }
      
      // Remove sensitive POST data
      if (event.request.data && typeof event.request.data === "object") {
        const sensitiveFields = ["password", "token", "secret", "key", "email"];
        sensitiveFields.forEach(field => {
          if (event.request!.data && typeof event.request!.data === "object") {
            delete (event.request!.data as any)[field];
          }
        });
      }
    }
    
    return event;
  },
  
  // Transaction filtering
  beforeSendTransaction(event) {
    // Remove sensitive user data from transactions
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // Filter out health check transactions in production
    if (sentryConfig.environment === "production" && 
        event.transaction?.includes("/api/health")) {
      return null;
    }
    
    // Filter out static asset requests
    if (event.transaction?.includes("/_next/") ||
        event.transaction?.includes("/favicon.ico")) {
      return null;
    }
    
    return event;
  },
  
  // Release tracking
  release: sentryConfig.release,
  
  // Debug mode for development
  debug: sentryConfig.debug,
  
  // Additional production configuration
  maxBreadcrumbs: 100,
  attachStacktrace: true,
  sendDefaultPii: false,
  
  // Server-specific settings
  shutdownTimeout: 2000,
  
  // Server-specific error ignoring
  ignoreErrors: [
    // Database connection errors that are handled
    "Connection terminated",
    "Connection lost",
    
    // Expected API errors
    "Unauthorized",
    "Forbidden",
    "Not Found",
    
    // Rate limiting errors
    "Too Many Requests",
    
    // Validation errors (these should be handled by the application)
    "ValidationError",
    "ZodError",
  ],
  
  // Tags for better error organization
  initialScope: {
    tags: {
      component: "server",
      service: "tender-hub",
    },
  },
  
  // Integrations
  integrations: [
    // HTTP integration for tracking HTTP requests
    Sentry.httpIntegration(),
    

  ],
});