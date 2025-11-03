import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { trackAPIError, trackDatabaseError, trackAuthError } from "./sentry-utils";
import { AuditLogger } from "./audit-logger";

/**
 * Standard API error response interface
 */
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

/**
 * Standard API success response interface
 */
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
}

/**
 * API response type
 */
export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

/**
 * Error types for classification
 */
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT_EXCEEDED",
  DATABASE = "DATABASE_ERROR",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE_ERROR",
  INTERNAL = "INTERNAL_SERVER_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
}

/**
 * Custom API error class
 */
export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.name = "APIError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, APIError);
  }
}

/**
 * Predefined API errors
 */
export const APIErrors = {
  // 400 Bad Request
  badRequest: (message = "Bad request", details?: any) =>
    new APIError(message, ErrorType.BAD_REQUEST, 400, details),

  validation: (message = "Validation failed", details?: any) =>
    new APIError(message, ErrorType.VALIDATION, 400, details),

  // 401 Unauthorized
  unauthorized: (message = "Authentication required", details?: any) =>
    new APIError(message, ErrorType.AUTHENTICATION, 401, details),

  // 403 Forbidden
  forbidden: (message = "Access denied", details?: any) =>
    new APIError(message, ErrorType.AUTHORIZATION, 403, details),

  // 404 Not Found
  notFound: (message = "Resource not found", details?: any) =>
    new APIError(message, ErrorType.NOT_FOUND, 404, details),

  // 409 Conflict
  conflict: (message = "Resource conflict", details?: any) =>
    new APIError(message, ErrorType.CONFLICT, 409, details),

  // 429 Too Many Requests
  rateLimit: (message = "Rate limit exceeded", details?: any) =>
    new APIError(message, ErrorType.RATE_LIMIT, 429, details),

  // 500 Internal Server Error
  internal: (message = "Internal server error", details?: any) =>
    new APIError(message, ErrorType.INTERNAL, 500, details, false),

  database: (message = "Database error", details?: any) =>
    new APIError(message, ErrorType.DATABASE, 500, details, false),

  externalService: (message = "External service error", details?: any) =>
    new APIError(message, ErrorType.EXTERNAL_SERVICE, 502, details, false),
};

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user context from request
 */
function extractUserContext(request: NextRequest) {
  // This would typically extract user info from JWT token or session
  // For now, we'll return basic info that can be extracted from headers
  return {
    userAgent: request.headers.get("user-agent") || "unknown",
    ipAddress: request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown",
    referer: request.headers.get("referer") || undefined,
  };
}

/**
 * Handle different types of errors and convert them to APIError
 */
function normalizeError(error: unknown, requestContext: any): APIError {
  // Already an APIError
  if (error instanceof APIError) {
    return error;
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return new APIError(
      "Validation failed",
      ErrorType.VALIDATION,
      400,
      {
        validationErrors: error.issues.map((err: any) => ({
          path: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      }
    );
  }

  // Database errors (common patterns)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // PostgreSQL/Neon specific errors
    if (message.includes("connection") || message.includes("timeout")) {
      return new APIError(
        "Database connection error",
        ErrorType.DATABASE,
        503,
        { originalError: error.message },
        false
      );
    }

    if (message.includes("unique constraint") || message.includes("duplicate")) {
      return new APIError(
        "Resource already exists",
        ErrorType.CONFLICT,
        409,
        { constraint: "unique_violation" }
      );
    }

    if (message.includes("foreign key") || message.includes("violates")) {
      return new APIError(
        "Invalid reference",
        ErrorType.BAD_REQUEST,
        400,
        { constraint: "foreign_key_violation" }
      );
    }

    if (message.includes("not found") || message.includes("does not exist")) {
      return new APIError(
        "Resource not found",
        ErrorType.NOT_FOUND,
        404
      );
    }

    // Authentication/Authorization errors
    if (message.includes("unauthorized") || message.includes("authentication")) {
      return new APIError(
        "Authentication failed",
        ErrorType.AUTHENTICATION,
        401
      );
    }

    if (message.includes("forbidden") || message.includes("access denied")) {
      return new APIError(
        "Access denied",
        ErrorType.AUTHORIZATION,
        403
      );
    }
  }

  // Generic error fallback
  return new APIError(
    error instanceof Error ? error.message : "Unknown error occurred",
    ErrorType.INTERNAL,
    500,
    { originalError: error instanceof Error ? error.message : String(error) },
    false
  );
}

/**
 * Main error handler function
 */
export async function handleAPIError(
  error: unknown,
  request: NextRequest,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    userRole?: string;
  }
): Promise<NextResponse<APIErrorResponse>> {
  const requestId = generateRequestId();
  const userContext = extractUserContext(request);
  const endpoint = context?.endpoint || request.nextUrl.pathname;
  const method = context?.method || request.method;

  // Normalize the error
  const apiError = normalizeError(error, { request, context });

  // Create error response
  const errorResponse: APIErrorResponse = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: process.env.NODE_ENV === "development" ? apiError.details : undefined,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Track error in Sentry based on error type
  try {
    if (apiError.code === ErrorType.DATABASE) {
      trackDatabaseError(apiError, {
        operation: method,
        userId: context?.userId,
      });
    } else if (apiError.code === ErrorType.AUTHENTICATION || apiError.code === ErrorType.AUTHORIZATION) {
      trackAuthError(apiError, {
        action: "login", // Default to login for API access errors
        userId: context?.userId,
        ipAddress: userContext.ipAddress,
      });
    } else {
      trackAPIError(apiError, {
        endpoint,
        method,
        statusCode: apiError.statusCode,
        userId: context?.userId,
        userRole: context?.userRole,
        requestId,
      });
    }
  } catch (sentryError) {
    console.error("Failed to track error in Sentry:", sentryError);
  }

  // Log error to audit trail for critical errors
  try {
    if (apiError.statusCode >= 500 || !apiError.isOperational) {
      await AuditLogger.logSystemAccess(context?.userId || "anonymous", "api_error", {
        metadata: {
          endpoint,
          method,
          statusCode: apiError.statusCode,
          errorCode: apiError.code,
          errorMessage: apiError.message,
          requestId,
          userAgent: userContext.userAgent,
          ipAddress: userContext.ipAddress,
        },
      });
    }
  } catch (auditError) {
    console.error("Failed to log error to audit trail:", auditError);
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error(`API Error [${requestId}]:`, {
      endpoint,
      method,
      error: apiError,
      stack: apiError.stack,
    });
  }

  return NextResponse.json(errorResponse, { status: apiError.statusCode });
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<APISuccessResponse<T>> {
  const response: APISuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<APISuccessResponse<T>>>,
  options?: {
    endpoint?: string;
    requireAuth?: boolean;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleAPIError(error, request, {
        endpoint: options?.endpoint,
        method: request.method,
        // Add user context extraction here if needed
      });
    }
  };
}

/**
 * Middleware for automatic error boundary in API routes
 */
export function createErrorMiddleware() {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleAPIError(error, request);
    }
  };
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: any // Zod schema
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be handled by normalizeError
    }
    throw APIErrors.badRequest("Invalid JSON in request body");
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: any // Zod schema
): T {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    return schema.parse(searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be handled by normalizeError
    }
    throw APIErrors.badRequest("Invalid query parameters");
  }
}

/**
 * Check if error should be reported to external services
 */
export function shouldReportError(error: APIError): boolean {
  // Don't report operational errors (4xx status codes)
  if (error.statusCode < 500 && error.isOperational) {
    return false;
  }

  // Don't report certain error types
  const ignoredErrorTypes = [
    ErrorType.VALIDATION,
    ErrorType.AUTHENTICATION,
    ErrorType.AUTHORIZATION,
    ErrorType.NOT_FOUND,
    ErrorType.RATE_LIMIT,
  ];

  return !ignoredErrorTypes.includes(error.code as ErrorType);
}

/**
 * Legacy export aliases for backward compatibility
 */
export const withErrorHandling = withErrorHandler;
export const ApiErrorType = ErrorType;

/**
 * Create error response helper
 */
export function createErrorResponse(
  error: APIError,
  requestId?: string
): NextResponse<APIErrorResponse> {
  const errorResponse: APIErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.details : undefined,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    },
  };

  return NextResponse.json(errorResponse, { status: error.statusCode });
}

/**
 * Handle validation errors
 */
export function handleValidationError(error: ZodError): never {
  throw new APIError(
    "Validation failed",
    ErrorType.VALIDATION,
    400,
    {
      validationErrors: error.issues.map((err: any) => ({
        path: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    }
  );
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(resource: string = "Resource"): never {
  throw APIErrors.notFound(`${resource} not found`);
}

/**
 * Create paginated response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  status = 200
): NextResponse<APISuccessResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  const response: APISuccessResponse<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> = {
    success: true,
    data: {
      items: data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    },
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };

  return NextResponse.json(response, { status });
}