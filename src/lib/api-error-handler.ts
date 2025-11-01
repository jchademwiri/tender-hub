import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error types
 */
export enum ApiErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  BAD_REQUEST_ERROR = "BAD_REQUEST_ERROR",
  FORBIDDEN_ERROR = "FORBIDDEN_ERROR",
  METHOD_NOT_ALLOWED_ERROR = "METHOD_NOT_ALLOWED_ERROR",
  PAYLOAD_TOO_LARGE_ERROR = "PAYLOAD_TOO_LARGE_ERROR",
  UNSUPPORTED_MEDIA_TYPE_ERROR = "UNSUPPORTED_MEDIA_TYPE_ERROR"
}

/**
 * Standard API error interface
 */
export interface ApiError {
  success: false;
  error: {
    type: ApiErrorType;
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
    path?: string;
    method?: string;
  };
}

/**
 * HTTP status code mappings
 */
const ERROR_STATUS_MAP: Record<ApiErrorType, number> = {
  [ApiErrorType.VALIDATION_ERROR]: 400,
  [ApiErrorType.BAD_REQUEST_ERROR]: 400,
  [ApiErrorType.AUTHENTICATION_ERROR]: 401,
  [ApiErrorType.AUTHORIZATION_ERROR]: 403,
  [ApiErrorType.FORBIDDEN_ERROR]: 403,
  [ApiErrorType.NOT_FOUND_ERROR]: 404,
  [ApiErrorType.METHOD_NOT_ALLOWED_ERROR]: 405,
  [ApiErrorType.CONFLICT_ERROR]: 409,
  [ApiErrorType.PAYLOAD_TOO_LARGE_ERROR]: 413,
  [ApiErrorType.UNSUPPORTED_MEDIA_TYPE_ERROR]: 415,
  [ApiErrorType.RATE_LIMIT_ERROR]: 429,
  [ApiErrorType.INTERNAL_SERVER_ERROR]: 500,
  [ApiErrorType.DATABASE_ERROR]: 500,
  [ApiErrorType.EXTERNAL_SERVICE_ERROR]: 502,
};

/**
 * User-friendly error messages for production
 */
const USER_FRIENDLY_MESSAGES: Record<ApiErrorType, string> = {
  [ApiErrorType.VALIDATION_ERROR]: "The provided data is invalid. Please check your input and try again.",
  [ApiErrorType.BAD_REQUEST_ERROR]: "The request could not be processed. Please check your input.",
  [ApiErrorType.AUTHENTICATION_ERROR]: "Authentication required. Please sign in to continue.",
  [ApiErrorType.AUTHORIZATION_ERROR]: "You don't have permission to perform this action.",
  [ApiErrorType.FORBIDDEN_ERROR]: "Access to this resource is forbidden.",
  [ApiErrorType.NOT_FOUND_ERROR]: "The requested resource was not found.",
  [ApiErrorType.METHOD_NOT_ALLOWED_ERROR]: "This method is not allowed for this endpoint.",
  [ApiErrorType.CONFLICT_ERROR]: "This action conflicts with the current state. Please refresh and try again.",
  [ApiErrorType.PAYLOAD_TOO_LARGE_ERROR]: "The request payload is too large. Please reduce the size and try again.",
  [ApiErrorType.UNSUPPORTED_MEDIA_TYPE_ERROR]: "The media type is not supported for this endpoint.",
  [ApiErrorType.RATE_LIMIT_ERROR]: "Too many requests. Please wait a moment before trying again.",
  [ApiErrorType.INTERNAL_SERVER_ERROR]: "An internal server error occurred. Please try again later.",
  [ApiErrorType.DATABASE_ERROR]: "A database error occurred. Please try again later.",
  [ApiErrorType.EXTERNAL_SERVICE_ERROR]: "An external service is temporarily unavailable. Please try again later.",
};

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a standardized API error response
 */
export function createApiError(
  type: ApiErrorType,
  message?: string,
  details?: any,
  requestId?: string,
  path?: string,
  method?: string
): ApiError {
  return {
    success: false,
    error: {
      type,
      code: type,
      message: message || USER_FRIENDLY_MESSAGES[type],
      details,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
      path,
      method,
    },
  };
}

/**
 * Create a NextResponse with standardized error format
 */
export function createErrorResponse(
  type: ApiErrorType,
  message?: string,
  details?: any,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  const error = createApiError(type, message, details, requestId, path, method);
  const status = ERROR_STATUS_MAP[type];
  
  return NextResponse.json(error, { status });
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(
  error: ZodError,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  const details = {
    issues: error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
    formattedErrors: error.format(),
  };

  return createErrorResponse(
    ApiErrorType.VALIDATION_ERROR,
    "Validation failed. Please check the provided data.",
    details,
    requestId,
    path,
    method
  );
}

/**
 * Handle database errors
 */
export function handleDatabaseError(
  error: any,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  console.error("Database error:", error);

  // Don't expose internal database errors in production
  const isProduction = process.env.NODE_ENV === "production";
  
  let message = USER_FRIENDLY_MESSAGES[ApiErrorType.DATABASE_ERROR];
  let details = undefined;

  if (!isProduction) {
    details = {
      originalError: error.message,
      code: error.code,
      constraint: error.constraint,
    };
  }

  // Handle specific database error types
  if (error.code === "23505") { // Unique constraint violation
    return createErrorResponse(
      ApiErrorType.CONFLICT_ERROR,
      "This resource already exists.",
      isProduction ? undefined : details,
      requestId,
      path,
      method
    );
  }

  if (error.code === "23503") { // Foreign key constraint violation
    return createErrorResponse(
      ApiErrorType.BAD_REQUEST_ERROR,
      "Referenced resource does not exist.",
      isProduction ? undefined : details,
      requestId,
      path,
      method
    );
  }

  if (error.code === "23502") { // Not null constraint violation
    return createErrorResponse(
      ApiErrorType.VALIDATION_ERROR,
      "Required field is missing.",
      isProduction ? undefined : details,
      requestId,
      path,
      method
    );
  }

  return createErrorResponse(
    ApiErrorType.DATABASE_ERROR,
    message,
    details,
    requestId,
    path,
    method
  );
}

/**
 * Handle authentication errors
 */
export function handleAuthenticationError(
  message?: string,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  return createErrorResponse(
    ApiErrorType.AUTHENTICATION_ERROR,
    message,
    undefined,
    requestId,
    path,
    method
  );
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(
  message?: string,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  return createErrorResponse(
    ApiErrorType.AUTHORIZATION_ERROR,
    message,
    undefined,
    requestId,
    path,
    method
  );
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  resource?: string,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  const message = resource 
    ? `${resource} not found.`
    : USER_FRIENDLY_MESSAGES[ApiErrorType.NOT_FOUND_ERROR];

  return createErrorResponse(
    ApiErrorType.NOT_FOUND_ERROR,
    message,
    undefined,
    requestId,
    path,
    method
  );
}

/**
 * Handle rate limit errors
 */
export function handleRateLimitError(
  retryAfter?: number,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  const response = createErrorResponse(
    ApiErrorType.RATE_LIMIT_ERROR,
    undefined,
    { retryAfter },
    requestId,
    path,
    method
  );

  if (retryAfter) {
    response.headers.set("Retry-After", retryAfter.toString());
  }

  return response;
}

/**
 * Handle external service errors
 */
export function handleExternalServiceError(
  service: string,
  error: any,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  console.error(`External service error (${service}):`, error);

  const isProduction = process.env.NODE_ENV === "production";
  
  return createErrorResponse(
    ApiErrorType.EXTERNAL_SERVICE_ERROR,
    `${service} service is temporarily unavailable.`,
    isProduction ? undefined : { originalError: error.message },
    requestId,
    path,
    method
  );
}

/**
 * Generic error handler for API routes
 */
export function handleApiError(
  error: any,
  requestId?: string,
  path?: string,
  method?: string
): NextResponse {
  console.error("API error:", error);

  // Handle specific error types
  if (error instanceof ZodError) {
    return handleValidationError(error, requestId, path, method);
  }

  if (error.message === "Authentication required") {
    return handleAuthenticationError(undefined, requestId, path, method);
  }

  if (error.message === "Admin access required" || error.message === "Manager access required") {
    return handleAuthorizationError(error.message, requestId, path, method);
  }

  if (error.message === "Email service unavailable") {
    return handleExternalServiceError("Email", error, requestId, path, method);
  }

  // Handle database errors
  if (error.code && typeof error.code === "string") {
    return handleDatabaseError(error, requestId, path, method);
  }

  // Default to internal server error
  const isProduction = process.env.NODE_ENV === "production";
  
  return createErrorResponse(
    ApiErrorType.INTERNAL_SERVER_ERROR,
    undefined,
    isProduction ? undefined : { originalError: error.message, stack: error.stack },
    requestId,
    path,
    method
  );
}

/**
 * Middleware wrapper for API routes with error handling
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const path = new URL(request.url).pathname;
    const method = request.method;

    try {
      return await handler(request, context);
    } catch (error) {
      // Log error with Sentry integration (if available)
      // TODO: Add Sentry integration when @sentry/nextjs is installed
      if (process.env.SENTRY_DSN) {
        console.error("Error logged for Sentry:", {
          error: error instanceof Error ? error.message : String(error),
          requestId,
          path,
          method,
          url: request.url,
        });
      }

      return handleApiError(error, requestId, path, method);
    }
  };
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: any
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Paginated success response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  },
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination,
    message,
    timestamp: new Date().toISOString(),
  });
}