import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./src/lib/env-validation";

Sentry.init({
  dsn: sentryConfig.publicDsn,
  
  // Environment configuration
  environment: sentryConfig.environment,
  
  // Performance monitoring
  tracesSampleRate: sentryConfig.tracesSampleRate,
  
  // Session replay for debugging
  replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
  replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
  
  // Error filtering to avoid sensitive data exposure
  beforeSend(event, hint) {
    // Filter out sensitive information
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't send authentication errors to Sentry
      if (error instanceof Error && error.message.includes("authentication")) {
        return null;
      }
      
      // Filter out database connection strings
      if (event.exception.values) {
        event.exception.values.forEach(exception => {
          if (exception.value) {
            exception.value = exception.value.replace(
              /postgresql:\/\/[^@]+@[^\/]+\/[^?\s]+/g,
              "postgresql://[FILTERED]"
            );
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
      }
      
      // Remove sensitive query parameters
      if (event.request.query_string && typeof event.request.query_string === 'string') {
        event.request.query_string = event.request.query_string.replace(
          /([?&])(token|key|password|secret)=[^&]*/gi,
          "$1$2=[FILTERED]"
        );
      }
    }
    
    return event;
  },
  
  // User context filtering
  beforeSendTransaction(event) {
    // Remove sensitive user data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    return event;
  },
  
  // Integration configuration
  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive text content
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
    // Browser profiling integration for performance monitoring
    Sentry.browserProfilingIntegration(),
    // HTTP integration for tracking fetch/XHR requests
    Sentry.httpIntegration(),
  ],
  
  // Release tracking
  release: sentryConfig.release,
  
  // Debug mode for development
  debug: sentryConfig.debug,
  
  // Additional production configuration
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  sendDefaultPii: false, // Don't send personally identifiable information
  
  // Ignore specific errors
  ignoreErrors: [
    // Browser extension errors
    "Non-Error promise rejection captured",
    "ResizeObserver loop limit exceeded",
    "Script error.",
    
    // Network errors that are not actionable
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    
    // User cancellation
    "AbortError",
    "The user aborted a request",
  ],
  
  // Ignore specific URLs
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    
    // Third-party scripts
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /googleadservices\.com/i,
  ],
});