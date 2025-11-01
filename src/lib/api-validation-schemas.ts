import { z } from "zod";

/**
 * Common validation schemas and utilities
 */

// Common field validations
export const uuidSchema = z.string().uuid("Invalid UUID format");
export const emailSchema = z.string().email("Invalid email format");
export const nameSchema = z.string().min(1, "Name is required").max(100, "Name too long");
export const urlSchema = z.string().url("Invalid URL format");
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format").optional();

// Pagination schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export const paginationResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  pages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Standard API response schemas
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  meta: z.any().optional(),
  timestamp: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.string(),
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    timestamp: z.string(),
    requestId: z.string(),
    path: z.string().optional(),
    method: z.string().optional(),
  }),
});

export const paginatedResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.any()),
  pagination: paginationResponseSchema,
  message: z.string().optional(),
  timestamp: z.string(),
});

/**
 * User Management Schemas
 */

// User role validation
export const userRoleSchema = z.enum(["owner", "admin", "manager", "user"]);
export const userStatusSchema = z.enum(["active", "suspended", "pending"]);

// User creation/update schemas
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: userRoleSchema.default("user"),
  status: userStatusSchema.default("pending"),
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  banned: z.boolean().optional(),
  banReason: z.string().optional(),
  banExpires: z.string().datetime().optional(),
});

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: userRoleSchema,
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.string().datetime().nullable(),
  status: userStatusSchema,
  invitedBy: z.string().nullable(),
  invitedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Invitation Schemas
 */

export const invitationStatusSchema = z.enum([
  "pending", "sent", "opened", "accepted", "expired", "cancelled", "declined"
]);

export const createInvitationSchema = z.object({
  email: emailSchema,
  role: userRoleSchema.default("user"),
  expiresIn: z.number().int().min(1).max(30).default(7), // days
  message: z.string().max(500).optional(),
});

export const invitationResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  status: invitationStatusSchema,
  expiresAt: z.string().datetime(),
  inviterId: z.string(),
  sentAt: z.string().datetime().nullable(),
  openedAt: z.string().datetime().nullable(),
  acceptedAt: z.string().datetime().nullable(),
  expiredAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  declinedAt: z.string().datetime().nullable(),
  emailSubject: z.string().nullable(),
  emailTemplate: z.string().nullable(),
  responseTime: z.number().nullable(),
  reminderSent: z.boolean(),
  reminderSentAt: z.string().datetime().nullable(),
  metadata: z.any().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Manager Approval Schemas
 */

export const approvalStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const approvalActionSchema = z.enum(["approve", "reject"]);

// Single approval request schemas
export const approvalRequestSchema = z.object({
  approvalId: uuidSchema,
  action: approvalActionSchema,
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long").optional(),
  notifyUser: z.boolean().default(true),
});

// Bulk approval request schemas
export const bulkApprovalRequestSchema = z.object({
  bulk: z.literal(true),
  action: approvalActionSchema,
  approvalIds: z.array(uuidSchema).min(1, "At least one approval ID required").max(50, "Too many approvals"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long").optional(),
  notifyUsers: z.boolean().default(true),
});

// Approval query parameters
export const approvalQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
  userId: uuidSchema.optional(),
  reviewedBy: uuidSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Approval response schemas
export const approvalRequestResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  requestedChanges: z.any(),
  status: approvalStatusSchema,
  requestedAt: z.string().datetime(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  userName: z.string(),
  userEmail: z.string(),
  userRole: userRoleSchema,
});

export const approvalActionResponseSchema = z.object({
  approvalId: z.string(),
  status: approvalStatusSchema,
  approvedChanges: z.any().optional(),
  approvedBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  rejectedBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  reason: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  rejectedAt: z.string().datetime().optional(),
});

export const bulkApprovalResponseSchema = z.object({
  results: z.object({
    successful: z.array(z.string()),
    failed: z.array(z.object({
      id: z.string(),
      error: z.string(),
    })),
    processed: z.number(),
    total: z.number(),
  }),
  summary: z.object({
    action: approvalActionSchema,
    processed: z.number(),
    successful: z.number(),
    failed: z.number(),
    total: z.number(),
  }),
});

// Approval statistics schemas
export const approvalStatsQuerySchema = z.object({
  period: z.coerce.number().int().min(1).max(365).default(30), // days
});

export const approvalStatsResponseSchema = z.object({
  summary: z.object({
    pending: z.number(),
    approved: z.number(),
    rejected: z.number(),
    total: z.number(),
    avgProcessingTimeHours: z.number(),
  }),
  period: z.object({
    days: z.number(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  recentActivity: z.array(z.object({
    date: z.string(),
    approved: z.number(),
    rejected: z.number(),
    total: z.number(),
  })),
  topRequesters: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    userEmail: z.string(),
    requests: z.object({
      total: z.number(),
      approved: z.number(),
      rejected: z.number(),
      pending: z.number(),
    }),
    approvalRate: z.number(),
  })),
});

/**
 * Publisher Management Schemas
 */

export const publisherCategorySchema = z.enum(["government", "municipal", "provincial", "private"]);

export const createPublisherSchema = z.object({
  name: nameSchema,
  website: urlSchema.optional(),
  provinceId: uuidSchema,
  category: publisherCategorySchema.default("government"),
  description: z.string().max(1000).optional(),
  contactEmail: emailSchema.optional(),
  contactPhone: phoneSchema,
  isActive: z.boolean().default(true),
});

export const updatePublisherSchema = createPublisherSchema.partial();

export const publisherResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().nullable(),
  provinceId: z.string(),
  category: publisherCategorySchema,
  description: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  isActive: z.boolean(),
  lastVerified: z.string().datetime().nullable(),
  metadata: z.any().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Joined province data
  provinceName: z.string().optional(),
  provinceCode: z.string().optional(),
});

/**
 * Province Management Schemas
 */

export const createProvinceSchema = z.object({
  name: nameSchema,
  code: z.string().min(2, "Province code required").max(10, "Province code too long"),
  description: z.string().max(1000).optional(),
});

export const updateProvinceSchema = createProvinceSchema.partial();

export const provinceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  // Aggregated data
  publisherCount: z.number().optional(),
});

/**
 * Bookmark Management Schemas
 */

export const createBookmarkSchema = z.object({
  publisherId: uuidSchema,
});

export const bookmarkResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  publisherId: z.string(),
  createdAt: z.string().datetime(),
  // Joined publisher data
  publisherName: z.string(),
  publisherWebsite: z.string().nullable(),
  publisherCategory: publisherCategorySchema,
  provinceName: z.string(),
});

/**
 * Analytics Schemas
 */

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
  metrics: z.array(z.string()).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

export const analyticsResponseSchema = z.object({
  metrics: z.record(z.string(), z.any()),
  timeRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    granularity: z.string(),
  }),
  data: z.array(z.record(z.string(), z.any())),
  summary: z.record(z.string(), z.any()).optional(),
});

/**
 * System Settings Schemas
 */

export const systemSettingSchema = z.object({
  settingKey: z.string().min(1, "Setting key required"),
  settingValue: z.any(),
  description: z.string().optional(),
});

export const systemSettingResponseSchema = z.object({
  id: z.string(),
  settingKey: z.string(),
  settingValue: z.any(),
  description: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Audit Log Schemas
 */

export const auditLogQuerySchema = paginationQuerySchema.extend({
  userId: uuidSchema.optional(),
  action: z.string().optional(),
  targetUserId: uuidSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

export const auditLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  action: z.string(),
  targetUserId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  metadata: z.any().nullable(),
  createdAt: z.string().datetime(),
  // Joined user data
  userName: z.string().nullable(),
  userEmail: z.string().nullable(),
  targetUserName: z.string().nullable(),
  targetUserEmail: z.string().nullable(),
});

/**
 * Validation middleware helper
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return (body: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    const result = schema.safeParse(body);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  };
}

export function validateQueryParams<T>(schema: z.ZodSchema<T>) {
  return (params: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    const result = schema.safeParse(params);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  };
}

/**
 * Type exports for TypeScript
 */
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationResponse = z.infer<typeof paginationResponseSchema>;
export type SuccessResponse<T = any> = z.infer<typeof successResponseSchema> & { data: T };
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type PaginatedResponse<T = any> = z.infer<typeof paginatedResponseSchema> & { data: T[] };

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type CreateInvitationRequest = z.infer<typeof createInvitationSchema>;
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;

export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type ApprovalAction = z.infer<typeof approvalActionSchema>;
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;
export type BulkApprovalRequest = z.infer<typeof bulkApprovalRequestSchema>;
export type ApprovalQuery = z.infer<typeof approvalQuerySchema>;
export type ApprovalRequestResponse = z.infer<typeof approvalRequestResponseSchema>;
export type ApprovalActionResponse = z.infer<typeof approvalActionResponseSchema>;
export type BulkApprovalResponse = z.infer<typeof bulkApprovalResponseSchema>;
export type ApprovalStatsQuery = z.infer<typeof approvalStatsQuerySchema>;
export type ApprovalStatsResponse = z.infer<typeof approvalStatsResponseSchema>;

export type PublisherCategory = z.infer<typeof publisherCategorySchema>;
export type CreatePublisherRequest = z.infer<typeof createPublisherSchema>;
export type UpdatePublisherRequest = z.infer<typeof updatePublisherSchema>;
export type PublisherResponse = z.infer<typeof publisherResponseSchema>;

export type CreateProvinceRequest = z.infer<typeof createProvinceSchema>;
export type UpdateProvinceRequest = z.infer<typeof updateProvinceSchema>;
export type ProvinceResponse = z.infer<typeof provinceResponseSchema>;

export type CreateBookmarkRequest = z.infer<typeof createBookmarkSchema>;
export type BookmarkResponse = z.infer<typeof bookmarkResponseSchema>;

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;

export type SystemSettingRequest = z.infer<typeof systemSettingSchema>;
export type SystemSettingResponse = z.infer<typeof systemSettingResponseSchema>;

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;