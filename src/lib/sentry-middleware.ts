import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { 
  trackAPIError, 
  trackPerformanceIssue, 
  trackSecurityEvent,
  setUserContextSafe,
  addSentryBreadcrumb 
} from "./sentry-utils";
import { sentryConfig } from "./env-validation";

/**
 * Sentry middleware for automatic error tracking and performance monitoring
 */

export interface SentryMiddlewareOptions {
  trackPerformance?: boolean;
  trackSecurity?: boolean;
  performanceThreshold?: number;
  excludePaths?: string[];
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

const DEFAULT_OPTIONS: SentryMiddlewareOptions = {
  trackPerformance: true,
  trackSecurity: true,
  performanceThreshold: sentryConfig.alerting.performanceThreshold,
  excludePaths: ["/api/health", "/_next/", "/favicon.ico"],
  includeRequestBody: false,
  includeResponseBody: false,
};

/**
 * Extract user information from request
 */
function extractUserFromRequest(request: NextRequest): {
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
} {
  // This would typically extract from JWT token or session
  // For now, extract from headers if available
  return {
    userId: request.headers.get("x-user-id") || undefined,
    userRole: request.headers.get("x-user-role") || undefined,
    ipAddress: request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

/**
 * Check if path should be excluded from tracking
 */
function shouldExcludePath(pathname: string, excludePaths: string[]): boolean {
  return excludePaths.some(path => pathname.includes(path));
}

/**
 * Sanitize request data for logging
 */
function sanitizeRequestData(request: NextRequest, includeBody: boolean) {
  const headers = Object.fromEntries(request.headers.entries());
  
  // Remove sensitive headers
  delete headers.authorization;
  delete headers.cookie;
  delete headers["x-api-key"];
  delete headers["x-auth-token"];
  
  return {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    headers,
    // Only include body if explicitly requested and it's a POST/PUT/PATCH
    includeBody: includeBody && ["POST", "PUT", "PATCH"].includes(request.method),
  };
}

/**
 * Sanitize response data for logging
 */
function sanitizeResponseData(response: NextResponse, includeBody: boolean) {
  const headers = Object.fromEntries(response.headers.entries());
  
  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    includeBody,
  };
}

/**
 * Track suspicious activity
 */
function trackSuspiciousActivity(
  request: NextRequest,
  response: NextResponse,
  userContext: ReturnType<typeof extractUserFromRequest>
) {
  const { status } = response;
  const { pathname } = request.nextUrl;
  
  // Track multiple failed authentication attempts
  if (status === 401 && pathname.includes("/auth/")) {
    trackSecurityEvent("suspicious_login", {
      userId: userContext.userId,
      ipAddress: userContext.ipAddress,
      userAgent: userContext.userAgent,
      endpoint: pathname,
    });
  }
  
  // Track unauthorized access attempts
  if (status === 403) {
    trackSecurityEvent("unauthorized_access", {
      userId: userContext.userId,
      ipAddress: userContext.ipAddress,
      userAgent: userContext.userAgent,
      endpoint: pathname,
    });
  }
  
  // Track rate limiting
  if (status === 429) {
    trackSecurityEvent("rate_limit_exceeded", {
      userId: userContext.userId,
      ipAddress: userContext.ipAddress,
      userAgent: userContext.userAgent,
      endpoint: pathname,
    });
  }
}

/**
 * Create Sentry middleware wrapper
 */
export function withSentryMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: SentryMiddlewareOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const { pathname } = request.nextUrl;
    
    // Skip tracking for excluded paths
    if (shouldExcludePath(pathname, opts.excludePaths || [])) {
      return handler(request);
    }
    
    // Extract user context
    const userContext = extractUserFromRequest(request);
    
    // Set user context in Sentry
    if (userContext.userId) {
      Sentry.setUser({
        id: userContext.userId,
        role: userContext.userRole,
      });
    }
    
    // Add request breadcrumb
    addSentryBreadcrumb(
      `API Request: ${request.method} ${pathname}`,
      "http",
      "info",
      {
        method: request.method,
        pathname,
        userId: userContext.userId,
      }
    );
    
    // Set request context
    Sentry.setContext("request", sanitizeRequestData(request, opts.includeRequestBody || false));
    
    try {
      // Execute the handler
      const response = await handler(request);
      const duration = Date.now() - startTime;
      
      // Set response context
      Sentry.setContext("response", sanitizeResponseData(response, opts.includeResponseBody || false));
      
      // Track performance if enabled
      if (opts.trackPerformance && duration > (opts.performanceThreshold || 500)) {
        trackPerformanceIssue(
          `Slow API response: ${request.method} ${pathname}`,
          {
            operation: `${request.method} ${pathname}`,
            duration,
            threshold: opts.performanceThreshold || 500,
            userId: userContext.userId,
            metadata: {
              statusCode: response.status,
              userAgent: userContext.userAgent,
            },
          }
        );
      }
      
      // Track security events if enabled
      if (opts.trackSecurity) {
        trackSuspiciousActivity(request, response, userContext);
      }
      
      // Log performance metrics
      if (duration > (opts.performanceThreshold || 500)) {
        console.warn(`Slow API response: ${request.method} ${pathname} took ${duration}ms`);
      }
      
      // Add response breadcrumb
      addSentryBreadcrumb(
        `API Response: ${response.status} in ${duration}ms`,
        "http",
        response.status >= 400 ? "error" : "info",
        {
          statusCode: response.status,
          duration,
          pathname,
        }
      );
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track the error
      trackAPIError(error as Error, {
        endpoint: pathname,
        method: request.method,
        statusCode: 500,
        userId: userContext.userId,
        userRole: userContext.userRole,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
      
      // Log error duration
      console.error(`API error in ${request.method} ${pathname} after ${duration}ms`);
      
      // Re-throw the error to be handled by the error handler
      throw error;
    }
  };
}

/**
 * Create Sentry middleware for Next.js middleware
 */
export function createSentryMiddleware(options: SentryMiddlewareOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    
    // Skip tracking for excluded paths
    if (shouldExcludePath(pathname, opts.excludePaths || [])) {
      return NextResponse.next();
    }
    
    // Extract user context
    const userContext = extractUserFromRequest(request);
    
    // Set user context in Sentry
    if (userContext.userId) {
      Sentry.setUser({
        id: userContext.userId,
        role: userContext.userRole,
      });
    }
    
    // Add middleware breadcrumb
    addSentryBreadcrumb(
      `Middleware: ${request.method} ${pathname}`,
      "middleware",
      "info",
      {
        method: request.method,
        pathname,
        userId: userContext.userId,
      }
    );
    
    return NextResponse.next();
  };
}

/**
 * Wrapper for API route handlers with automatic Sentry integration
 */
export function withSentryAPI<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  options: SentryMiddlewareOptions = {}
) {
  return withSentryMiddleware(
    async (request: NextRequest) => {
      return handler(request);
    },
    options
  );
}

/**
 * Initialize Sentry middleware system
 */
export function initializeSentryMiddleware(): void {
  if (!sentryConfig.dsn) {
    console.warn("Sentry not configured, middleware tracking disabled");
    return;
  }
  
  console.log("Sentry middleware initialized", {
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    performanceTracking: true,
    securityTracking: true,
  });
}