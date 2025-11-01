/**
 * API Documentation and Type Definitions
 * 
 * This file provides comprehensive documentation for all API endpoints,
 * including request/response schemas, authentication requirements,
 * and usage examples.
 */

import type {
  ApprovalQuery,
  ApprovalRequest,
  BulkApprovalRequest,
  ApprovalRequestResponse,
  ApprovalActionResponse,
  BulkApprovalResponse,
  ApprovalStatsQuery,
  ApprovalStatsResponse,
  PaginatedResponse,
  SuccessResponse,
  ErrorResponse
} from "./api-validation-schemas";

/**
 * API Endpoint Documentation
 */
export const API_ENDPOINTS = {
  // Manager Approval Endpoints
  MANAGER_APPROVALS: {
    LIST: {
      method: "GET" as const,
      path: "/api/manager/approvals",
      description: "List approval requests with pagination, filtering, and sorting",
      authentication: "Manager role required",
      queryParams: {
        page: "Page number (default: 1)",
        limit: "Items per page (default: 50, max: 100)",
        status: "Filter by status: pending, approved, rejected, all (default: pending)",
        sortBy: "Sort field: requestedAt, userName, userEmail (default: requestedAt)",
        sortOrder: "Sort order: asc, desc (default: desc)",
        search: "Search in user name and email"
      },
      responseType: "PaginatedResponse<ApprovalRequestResponse[]>",
      example: {
        request: "GET /api/manager/approvals?page=1&limit=10&status=pending&search=john",
        response: {
          success: true,
          data: [
            {
              id: "123e4567-e89b-12d3-a456-426614174000",
              userId: "user-123",
              requestedChanges: { name: "John Doe Updated" },
              status: "pending",
              requestedAt: "2024-01-01T10:00:00Z",
              reviewedBy: null,
              reviewedAt: null,
              rejectionReason: null,
              userName: "John Doe",
              userEmail: "john@example.com",
              userRole: "user"
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            pages: 3,
            hasNext: true,
            hasPrev: false
          },
          message: "Retrieved 1 approval requests",
          timestamp: "2024-01-01T10:00:00Z"
        }
      }
    },

    SINGLE_APPROVAL: {
      method: "POST" as const,
      path: "/api/manager/approvals",
      description: "Approve or reject a single approval request",
      authentication: "Manager role required",
      requestBody: {
        approvalId: "UUID of the approval request",
        action: "approve or reject",
        reason: "Required for reject action",
        notifyUser: "Send email notification (default: true)"
      },
      responseType: "SuccessResponse<ApprovalActionResponse>",
      example: {
        request: {
          approvalId: "123e4567-e89b-12d3-a456-426614174000",
          action: "approve",
          notifyUser: true
        },
        response: {
          success: true,
          data: {
            approvalId: "123e4567-e89b-12d3-a456-426614174000",
            status: "approved",
            approvedChanges: { name: "John Doe Updated" },
            approvedBy: {
              id: "manager-123",
              name: "Manager Name",
              email: "manager@example.com"
            },
            approvedAt: "2024-01-01T10:00:00Z"
          },
          message: "Profile update approved successfully",
          timestamp: "2024-01-01T10:00:00Z"
        }
      }
    },

    BULK_APPROVAL: {
      method: "POST" as const,
      path: "/api/manager/approvals/bulk",
      description: "Approve or reject multiple approval requests",
      authentication: "Manager role required",
      requestBody: {
        bulk: "Must be true",
        action: "approve or reject",
        approvalIds: "Array of approval request UUIDs (max 50)",
        reason: "Required for reject action",
        notifyUsers: "Send email notifications (default: true)"
      },
      responseType: "SuccessResponse<BulkApprovalResponse>",
      example: {
        request: {
          bulk: true,
          action: "approve",
          approvalIds: [
            "123e4567-e89b-12d3-a456-426614174000",
            "123e4567-e89b-12d3-a456-426614174001"
          ],
          notifyUsers: true
        },
        response: {
          success: true,
          data: {
            results: {
              successful: ["123e4567-e89b-12d3-a456-426614174000"],
              failed: [
                {
                  id: "123e4567-e89b-12d3-a456-426614174001",
                  error: "Approval request not found"
                }
              ],
              processed: 2,
              total: 2
            },
            summary: {
              action: "approve",
              processed: 2,
              successful: 1,
              failed: 1,
              total: 2
            }
          },
          message: "Bulk approve operation completed",
          timestamp: "2024-01-01T10:00:00Z"
        }
      }
    },

    GET_APPROVAL: {
      method: "GET" as const,
      path: "/api/manager/approvals/[id]",
      description: "Get details of a specific approval request",
      authentication: "Manager role required",
      pathParams: {
        id: "UUID of the approval request"
      },
      responseType: "SuccessResponse<ApprovalRequestResponse>",
      example: {
        request: "GET /api/manager/approvals/123e4567-e89b-12d3-a456-426614174000",
        response: {
          success: true,
          data: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            status: "pending",
            requestedAt: "2024-01-01T09:00:00Z",
            reviewedAt: null,
            rejectionReason: null,
            requestedChanges: { name: "John Doe Updated" },
            user: {
              id: "user-123",
              name: "John Doe",
              email: "john@example.com",
              role: "user",
              status: "active",
              createdAt: "2024-01-01T08:00:00Z"
            },
            reviewer: null
          },
          message: "Approval request details retrieved successfully",
          timestamp: "2024-01-01T10:00:00Z"
        }
      }
    },

    APPROVAL_ACTION: {
      method: "POST" as const,
      path: "/api/manager/approvals/[id]",
      description: "Approve or reject a specific approval request",
      authentication: "Manager role required",
      pathParams: {
        id: "UUID of the approval request"
      },
      requestBody: {
        action: "approve or reject",
        reason: "Required for reject action",
        notifyUser: "Send email notification (default: true)"
      },
      responseType: "SuccessResponse<ApprovalActionResponse>",
      example: {
        request: {
          action: "reject",
          reason: "Insufficient information provided",
          notifyUser: true
        },
        response: {
          success: true,
          data: {
            approvalId: "123e4567-e89b-12d3-a456-426614174000",
            status: "rejected",
            rejectedBy: {
              id: "manager-123",
              name: "Manager Name",
              email: "manager@example.com"
            },
            reason: "Insufficient information provided",
            rejectedAt: "2024-01-01T10:00:00Z"
          },
          message: "Profile update rejected",
          timestamp: "2024-01-01T10:00:00Z"
        }
      }
    },

    STATS: {
      method: "GET" as const,
      path: "/api/manager/approvals/stats",
      description: "Get approval statistics and metrics",
      authentication: "Manager role required",
      queryParams: {
        period: "Number of days to include in statistics (default: 30, max: 365)"
      },
      responseType: "SuccessResponse<ApprovalStatsResponse>",
      example: {
        request: "GET /api/manager/approvals/stats?period=30",
        response: {
          success: true,
          data: {
            summary: {
              pending: 15,
              approved: 45,
              rejected: 5,
              total: 50,
              avgProcessingTimeHours: 24.5
            },
            period: {
              days: 30,
              startDate: "2024-01-01T00:00:00Z",
              endDate: "2024-01-31T23:59:59Z"
            },
            recentActivity: [
              {
                date: "2024-01-31",
                approved: 3,
                rejected: 1,
                total: 4
              }
            ],
            topRequesters: [
              {
                userId: "user-123",
                userName: "John Doe",
                userEmail: "john@example.com",
                requests: {
                  total: 5,
                  approved: 4,
                  rejected: 1,
                  pending: 0
                },
                approvalRate: 80
              }
            ]
          },
          message: "Approval statistics retrieved successfully",
          timestamp: "2024-01-01T10:00:00Z"
        }
      }
    },

    COUNT: {
      method: "GET" as const,
      path: "/api/manager/approvals/count",
      description: "Get count of pending approval requests",
      authentication: "Manager role required",
      responseType: "SuccessResponse<{ pendingCount: number; timestamp: string }>",
      example: {
        request: "GET /api/manager/approvals/count",
        response: {
          success: true,
          data: {
            pendingCount: 15,
            timestamp: "2024-01-01T10:00:00Z"
          },
          message: "Pending approval count retrieved successfully",
          timestamp: "2024-01-01T10:00:00Z"
        }
      }
    }
  }
} as const;

/**
 * Error Response Examples
 */
export const ERROR_EXAMPLES = {
  VALIDATION_ERROR: {
    success: false,
    error: {
      type: "VALIDATION_ERROR",
      code: "VALIDATION_ERROR",
      message: "The provided data is invalid. Please check your input and try again.",
      details: {
        issues: [
          {
            field: "approvalId",
            message: "Invalid UUID format",
            code: "invalid_string"
          }
        ]
      },
      timestamp: "2024-01-01T10:00:00Z",
      requestId: "req_1234567890_abc123"
    }
  },

  AUTHENTICATION_ERROR: {
    success: false,
    error: {
      type: "AUTHENTICATION_ERROR",
      code: "AUTHENTICATION_ERROR",
      message: "Authentication required. Please sign in to continue.",
      timestamp: "2024-01-01T10:00:00Z",
      requestId: "req_1234567890_abc123"
    }
  },

  AUTHORIZATION_ERROR: {
    success: false,
    error: {
      type: "AUTHORIZATION_ERROR",
      code: "AUTHORIZATION_ERROR",
      message: "You don't have permission to perform this action.",
      timestamp: "2024-01-01T10:00:00Z",
      requestId: "req_1234567890_abc123"
    }
  },

  NOT_FOUND_ERROR: {
    success: false,
    error: {
      type: "NOT_FOUND_ERROR",
      code: "NOT_FOUND_ERROR",
      message: "Approval request not found.",
      timestamp: "2024-01-01T10:00:00Z",
      requestId: "req_1234567890_abc123"
    }
  },

  RATE_LIMIT_ERROR: {
    success: false,
    error: {
      type: "RATE_LIMIT_ERROR",
      code: "RATE_LIMIT_ERROR",
      message: "Too many requests. Please wait a moment before trying again.",
      details: {
        retryAfter: 60
      },
      timestamp: "2024-01-01T10:00:00Z",
      requestId: "req_1234567890_abc123"
    }
  },

  INTERNAL_SERVER_ERROR: {
    success: false,
    error: {
      type: "INTERNAL_SERVER_ERROR",
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal server error occurred. Please try again later.",
      timestamp: "2024-01-01T10:00:00Z",
      requestId: "req_1234567890_abc123"
    }
  }
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS_CODES = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

/**
 * Authentication Requirements
 */
export const AUTH_REQUIREMENTS = {
  NONE: "No authentication required",
  USER: "User authentication required",
  MANAGER: "Manager role or higher required",
  ADMIN: "Admin role or higher required",
  OWNER: "Owner role required"
} as const;

/**
 * Rate Limiting Information
 */
export const RATE_LIMITS = {
  GLOBAL: {
    window: "60 seconds",
    max: 100,
    description: "General API rate limit"
  },
  SIGN_IN: {
    window: "60 seconds",
    max: 3,
    description: "Sign-in attempts"
  },
  SIGN_UP: {
    window: "300 seconds",
    max: 3,
    description: "Sign-up attempts"
  },
  PASSWORD_RESET: {
    window: "900 seconds",
    max: 2,
    description: "Password reset requests"
  },
  API_ENDPOINTS: {
    window: "60 seconds",
    max: 50,
    description: "API endpoint requests"
  }
} as const;

/**
 * API Usage Guidelines
 */
export const USAGE_GUIDELINES = {
  PAGINATION: {
    defaultLimit: 50,
    maxLimit: 100,
    description: "Use pagination for large datasets. Default page size is 50, maximum is 100."
  },
  SORTING: {
    defaultOrder: "desc",
    description: "Most endpoints support sorting. Default order is descending by creation date."
  },
  FILTERING: {
    description: "Use query parameters for filtering. Multiple filters are combined with AND logic."
  },
  SEARCH: {
    description: "Search parameters perform case-insensitive partial matching."
  },
  BULK_OPERATIONS: {
    maxItems: 50,
    description: "Bulk operations are limited to 50 items per request for performance."
  },
  ERROR_HANDLING: {
    description: "All errors follow a consistent format with type, code, message, and optional details."
  },
  TIMESTAMPS: {
    format: "ISO 8601",
    description: "All timestamps are in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) in UTC."
  }
} as const;

/**
 * Type definitions for API documentation
 */
export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS][keyof typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]];
export type ErrorExample = typeof ERROR_EXAMPLES[keyof typeof ERROR_EXAMPLES];
export type HttpStatusCode = typeof HTTP_STATUS_CODES[keyof typeof HTTP_STATUS_CODES];
export type AuthRequirement = typeof AUTH_REQUIREMENTS[keyof typeof AUTH_REQUIREMENTS];
export type RateLimit = typeof RATE_LIMITS[keyof typeof RATE_LIMITS];
export type UsageGuideline = typeof USAGE_GUIDELINES[keyof typeof USAGE_GUIDELINES];