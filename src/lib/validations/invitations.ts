import { z } from 'zod';
import { emailSchema } from './common';

/**
 * Invitation API validation schemas
 */

// Single invitation creation schema
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'manager', 'user'], {
    message: 'Please select a valid role',
  }),
  sendEmail: z.boolean().optional().default(true),
});

// Bulk invitation creation schema
export const bulkInvitationSchema = z.object({
  invitations: z.array(z.object({
    email: emailSchema,
    role: z.enum(['admin', 'manager', 'user'], {
      message: 'Please select a valid role',
    }),
    name: z.string().optional(),
    department: z.string().optional(),
    customMessage: z.string().optional(),
  })).min(1, 'At least one invitation is required').max(100, 'Maximum 100 invitations per request'),
  templateId: z.string().optional(),
  sendImmediately: z.boolean().optional().default(true),
  scheduleDate: z.string().datetime().optional(),
});

// Invitation query parameters schema
export const invitationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(50),
  status: z.enum(['pending', 'accepted', 'expired', 'cancelled']).optional(),
  role: z.enum(['admin', 'manager', 'user']).optional(),
  search: z.string().optional(),
});

// Type exports for TypeScript
export type CreateInvitationData = z.infer<typeof createInvitationSchema>;
export type BulkInvitationData = z.infer<typeof bulkInvitationSchema>;
export type InvitationQueryData = z.infer<typeof invitationQuerySchema>;

// Validation helpers
export const invitationValidationHelpers = {
  /**
   * Validate create invitation data
   */
  validateCreateInvitation: (data: unknown): CreateInvitationData => {
    return createInvitationSchema.parse(data);
  },

  /**
   * Validate bulk invitation data
   */
  validateBulkInvitation: (data: unknown): BulkInvitationData => {
    return bulkInvitationSchema.parse(data);
  },

  /**
   * Validate invitation query parameters
   */
  validateInvitationQuery: (data: unknown): InvitationQueryData => {
    return invitationQuerySchema.parse(data);
  },

  /**
   * Safe validation methods
   */
  safeValidateCreateInvitation: (data: unknown) => createInvitationSchema.safeParse(data),
  safeValidateBulkInvitation: (data: unknown) => bulkInvitationSchema.safeParse(data),
  safeValidateInvitationQuery: (data: unknown) => invitationQuerySchema.safeParse(data),

  /**
   * Transform invitation data for database
   */
  transformForCreateInvitation: (data: CreateInvitationData) => {
    return {
      email: data.email.toLowerCase().trim(),
      role: data.role,
      sendEmail: data.sendEmail,
    };
  },

  /**
   * Transform bulk invitation data for processing
   */
  transformForBulkInvitation: (data: BulkInvitationData) => {
    return {
      invitations: data.invitations.map(inv => ({
        email: inv.email.toLowerCase().trim(),
        role: inv.role,
        name: inv.name?.trim(),
        department: inv.department?.trim(),
        customMessage: inv.customMessage?.trim(),
      })),
      templateId: data.templateId,
      sendImmediately: data.sendImmediately,
      scheduleDate: data.scheduleDate,
    };
  },
};

// Default values
export const invitationDefaultValues = {
  createInvitation: {
    email: '',
    role: 'user' as const,
    sendEmail: true,
  },
  bulkInvitation: {
    invitations: [],
    sendImmediately: true,
  },
  query: {
    page: 1,
    limit: 50,
  },
};

// Error messages
export const invitationErrorMessages = {
  emailRequired: 'Email is required',
  roleRequired: 'Role is required',
  invalidRole: 'Please select a valid role',
  maxInvitations: 'Maximum 100 invitations per request',
  minInvitations: 'At least one invitation is required',
  userAlreadyExists: 'User with this email already exists',
  invitationAlreadySent: 'Invitation already sent to this email',
  dailyLimitReached: 'Daily invitation limit reached',
  insufficientPermissions: 'Insufficient permissions to invite users',
  invalidInvitationData: 'Invalid invitation data provided',
  bulkOperationFailed: 'Bulk invitation operation failed',
};