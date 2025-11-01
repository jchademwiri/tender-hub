import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rateLimit, user } from "@/db/schema";
import { logAuditEvent } from "@/lib/audit-logger";
import { auth } from "@/lib/auth";

/**
 * Production Role-Based Middleware System
 *
 * Features implemented:
 * ✅ Role-based request validation middleware
 * ✅ API rate limiting by role
 * ✅ Request logging and audit trails
 * ✅ Permission checking middleware
 * ✅ Resource access control middleware
 * ✅ Session hijacking detection
 * ✅ Suspicious activity detection
 * ✅ IP-based access tracking
 * ✅ Comprehensive security monitoring
 */

export type RoleLevel = "admin" | "manager" | "user";

/**
 * Get user role with hierarchy level
 */
export function getRoleLevel(role: string | null): number {
  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    manager: 2,
    user: 1,
  };
  return roleHierarchy[role || "user"] || 0;
}

/**
 * Check if user has minimum required role level
 */
export function hasMinimumRole(
  userRole: string | null,
  requiredRole: RoleLevel,
): boolean {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);
  return userLevel >= requiredLevel;
}

/**
 * Middleware to require specific role
 */
export async function requireRoleMiddleware(
  request: NextRequest,
  requiredRole: RoleLevel,
  options?: {
    redirectTo?: string;
    logAccess?: boolean;
  },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      if (options?.logAccess) {
        await logAccessAttempt(request, "unauthorized", {
          reason: "no_session",
        });
      }

      const redirectUrl = options?.redirectTo || "/?error=unauthorized";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    if (!hasMinimumRole(session.user.role || null, requiredRole)) {
      if (options?.logAccess) {
        await logAccessAttempt(request, "forbidden", {
          userRole: session.user.role,
          requiredRole,
          reason: "insufficient_role",
        });
      }

      const redirectUrl = options?.redirectTo || "/dashboard?error=forbidden";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Log successful access if requested
    if (options?.logAccess) {
      await logAccessAttempt(request, "granted", {
        userRole: session.user.role,
        requiredRole,
      });
    }

    return null; // Access granted, continue to route
  } catch (error) {
    console.error("Role middleware error:", error);

    if (options?.logAccess) {
      await logAccessAttempt(request, "error", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }

    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 },
    );
  }
}

/**
 * Middleware to check resource ownership or permission
 */
export async function requireResourceAccess(
  request: NextRequest,
  resourceType: string,
  resourceId: string,
  action: string = "read",
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Implement resource-specific access control logic
    const hasAccess = await checkResourcePermission(
      session.user.id,
      resourceType,
      resourceId,
      action,
    );

    if (!hasAccess) {
      await logAccessAttempt(request, "forbidden", {
        resourceType,
        resourceId,
        action,
        reason: "insufficient_permissions",
      });

      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return null; // Access granted
  } catch (error) {
    console.error("Resource access middleware error:", error);
    return NextResponse.json(
      { error: "Access control error" },
      { status: 500 },
    );
  }
}

/**
 * Rate limiting middleware by role
 */
export async function roleBasedRateLimit(
  request: NextRequest,
  role: string | null,
) {
  // Implement role-based rate limiting
  const limits: Record<string, { window: number; max: number }> = {
    owner: { window: 60, max: 2000 }, // Highest limit for owners
    admin: { window: 60, max: 1000 }, // High limit for admins
    manager: { window: 60, max: 500 }, // Medium limit for managers
    user: { window: 60, max: 100 }, // Lower limit for users
  };

  const userLimit = limits[role || "user"] || limits.user;

  // Implement rate limiting logic using database
  const isRateLimited = await checkRateLimit(request, userLimit);

  if (isRateLimited) {
    // Log rate limit exceeded
    await logAuditEvent("system_access", {
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: {
        action: "rate_limit_exceeded",
        role,
        limit: userLimit,
        path: request.nextUrl.pathname,
        method: request.method,
      },
    });

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: userLimit.window,
        limit: userLimit.max,
      },
      {
        status: 429,
        headers: {
          "Retry-After": userLimit.window.toString(),
          "X-RateLimit-Limit": userLimit.max.toString(),
          "X-RateLimit-Window": userLimit.window.toString(),
        },
      },
    );
  }

  return null; // Within limits
}

/**
 * Log access attempts for audit purposes
 */
async function logAccessAttempt(
  request: NextRequest,
  status: "granted" | "forbidden" | "unauthorized" | "error",
  metadata: Record<string, unknown>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    await logAuditEvent(`access_${status}` as "system_access", {
      userId: session?.user?.id,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
        ...metadata,
      },
    });
  } catch (error) {
    console.error("Failed to log access attempt:", error);
  }
}

/**
 * Check if user has permission for specific resource
 */
async function checkResourcePermission(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
): Promise<boolean> {
  try {
    // Implement resource-specific permission checking
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return false;
    }

    const userRole = userResult[0].role;

    // Implement resource ownership logic
    switch (resourceType) {
      case "user":
        // Users can access their own data, managers can access their team, admins can access all
        if (userId === resourceId) return true;
        if (action === "read" && hasMinimumRole(userRole, "manager"))
          return true;
        if (hasMinimumRole(userRole, "admin")) return true;
        return false;

      case "profile":
        // Users can modify their own profile, managers can approve changes
        if (userId === resourceId && action === "update") return true;
        if (action === "approve" && hasMinimumRole(userRole, "manager"))
          return true;
        if (hasMinimumRole(userRole, "admin")) return true;
        return false;

      case "invitation":
        // Managers can create invitations, admins can manage all
        if (action === "create" && hasMinimumRole(userRole, "manager"))
          return true;
        if (hasMinimumRole(userRole, "admin")) return true;
        return false;

      case "audit":
        // Only admins can access audit logs
        return hasMinimumRole(userRole, "admin");

      case "system":
        // Only admins and owners can access system resources
        return hasMinimumRole(userRole, "admin");

      case "analytics":
        // Managers can view analytics, admins can export
        if (action === "read" && hasMinimumRole(userRole, "manager"))
          return true;
        if (action === "export" && hasMinimumRole(userRole, "admin"))
          return true;
        return false;

      case "publisher":
        // All authenticated users can read publishers, managers can modify
        if (action === "read") return true;
        if (action === "update" && hasMinimumRole(userRole, "manager"))
          return true;
        if (hasMinimumRole(userRole, "admin")) return true;
        return false;

      case "bookmark":
        // Users can manage their own bookmarks
        if (userId === resourceId) return true;
        if (hasMinimumRole(userRole, "admin")) return true;
        return false;

      default:
        // Default to admin-only access for unknown resources
        return hasMinimumRole(userRole, "admin");
    }
  } catch (error) {
    console.error("Failed to check resource permission:", error);
    return false;
  }
}

/**
 * Check rate limit for user
 */
async function checkRateLimit(
  request: NextRequest,
  limit: { window: number; max: number },
): Promise<boolean> {
  try {
    // Implement rate limiting logic using database
    const session = await auth.api.getSession({ headers: await headers() });
    const clientIP = getClientIP(request);
    const userId = session?.user?.id || `ip:${clientIP}`;

    // Create a unique key for this user/IP and endpoint
    const key = `${userId}:${request.nextUrl.pathname}`;
    const now = Date.now();
    const windowStart = now - limit.window * 1000;

    // Clean up old entries and get current count
    await db
      .delete(rateLimit)
      .where(
        and(
          eq(rateLimit.key, key),
          sql`${rateLimit.lastRequest} < ${windowStart}`,
        ),
      );

    // Get current request count in the window
    const currentRequests = await db
      .select({ count: sql<number>`count(*)` })
      .from(rateLimit)
      .where(eq(rateLimit.key, key));

    const requestCount = currentRequests[0]?.count || 0;

    if (requestCount >= limit.max) {
      return true; // Rate limited
    }

    // Add this request to the rate limit tracking
    await db.insert(rateLimit).values({
      id: crypto.randomUUID(),
      key,
      count: 1,
      lastRequest: now,
    });

    return false; // Within limits
  } catch (error) {
    console.error("Failed to check rate limit:", error);
    // On error, allow the request to proceed (fail open)
    return false;
  }
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    "unknown"
  );
}

/**
 * Enhanced session security check
 */
async function validateSessionSecurity(
  request: NextRequest,
  session: {
    user: { id: string; role?: string };
    id: string;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  try {
    const currentIP = getClientIP(request);
    const currentUserAgent = request.headers.get("user-agent") || "";

    // Check for session hijacking indicators
    const sessionMetadata = session.metadata || {};
    const originalIP = sessionMetadata.ipAddress;
    const originalUserAgent = sessionMetadata.userAgent;

    // Allow some flexibility for mobile networks and legitimate IP changes
    if (originalIP && originalIP !== currentIP) {
      // Log potential session hijacking
      await logAuditEvent("suspicious_activity", {
        userId: session.user.id,
        ipAddress: currentIP,
        userAgent: currentUserAgent,
        metadata: {
          suspiciousActivity: "ip_address_change",
          originalIP,
          currentIP,
          sessionId: session.id,
        },
      });

      // In production, you might want to require re-authentication
      // For now, we'll log but allow the session
    }

    if (originalUserAgent && originalUserAgent !== currentUserAgent) {
      // Log user agent change
      await logAuditEvent("system_access", {
        userId: session.user.id,
        ipAddress: currentIP,
        userAgent: currentUserAgent,
        metadata: {
          activity: "user_agent_change",
          originalUserAgent,
          currentUserAgent,
          sessionId: session.id,
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to validate session security:", error);
    return true; // Fail open for availability
  }
}

/**
 * Create role-based API route handler wrapper
 */
export function withRoleMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  requiredRole: RoleLevel,
  options?: {
    checkResource?: boolean;
    resourceType?: string;
    action?: string;
    logAccess?: boolean;
    skipRateLimit?: boolean;
  },
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check role permissions
      const roleCheck = await requireRoleMiddleware(request, requiredRole, {
        logAccess: options?.logAccess,
      });
      if (roleCheck) return roleCheck;

      // Get session for additional checks
      const session = await auth.api.getSession({ headers: await headers() });

      if (session) {
        // Validate session security
        await validateSessionSecurity(request, session);

        // Apply rate limiting unless skipped
        if (!options?.skipRateLimit) {
          const rateLimitCheck = await roleBasedRateLimit(
            request,
            session.user.role || null,
          );
          if (rateLimitCheck) return rateLimitCheck;
        }
      }

      // Check resource permissions if specified
      if (options?.checkResource && options?.resourceType) {
        const url = new URL(request.url);
        const resourceId = url.pathname.split("/").pop() || "";

        const resourceCheck = await requireResourceAccess(
          request,
          options.resourceType,
          resourceId,
          options.action,
        );

        if (resourceCheck) return resourceCheck;
      }

      // Execute original handler
      const response = await handler(request);

      // Log successful API access
      if (options?.logAccess && session) {
        await logAuditEvent("system_access", {
          userId: session.user.id,
          ipAddress: getClientIP(request),
          userAgent: request.headers.get("user-agent") || undefined,
          metadata: {
            action: "api_access",
            method: request.method,
            path: request.nextUrl.pathname,
            statusCode: response.status,
            resourceType: options.resourceType,
            resourceAction: options.action,
          },
        });
      }

      return response;
    } catch (error) {
      console.error("Role middleware error:", error);

      // Log the error
      const session = await auth.api.getSession({ headers: await headers() });
      await logAuditEvent("system_access", {
        userId: session?.user?.id,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: {
          action: "middleware_error",
          error: error instanceof Error ? error.message : "unknown",
          path: request.nextUrl.pathname,
          method: request.method,
        },
      });

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
