import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema } from './common';

/**
 * Authentication validation schemas
 */

// Login form schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Sign up form schema
export const signupFormSchema = z.object({
  name: nameSchema
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Forgot password form schema
export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

// Reset password form schema
export const resetPasswordFormSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Change password form schema (for authenticated users)
export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// Email verification schema
export const emailVerificationFormSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Update profile form schema
export const updateProfileFormSchema = z.object({
  name: nameSchema
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
});

// User invitation schema
export const userInvitationFormSchema = z.object({
  email: emailSchema,
  role: z.enum(['owner', 'admin', 'manager', 'user'], {
    message: 'Please select a role',
  }),
});

// Accept invitation schema
export const acceptInvitationFormSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  name: nameSchema
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;
export type EmailVerificationFormData = z.infer<typeof emailVerificationFormSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileFormSchema>;
export type UserInvitationFormData = z.infer<typeof userInvitationFormSchema>;
export type AcceptInvitationFormData = z.infer<typeof acceptInvitationFormSchema>;

// Validation helpers
export const authValidationHelpers = {
  /**
   * Validate login form data
   */
  validateLogin: (data: unknown): LoginFormData => {
    return loginFormSchema.parse(data);
  },

  /**
   * Validate signup form data
   */
  validateSignup: (data: unknown): SignupFormData => {
    return signupFormSchema.parse(data);
  },

  /**
   * Validate forgot password form data
   */
  validateForgotPassword: (data: unknown): ForgotPasswordFormData => {
    return forgotPasswordFormSchema.parse(data);
  },

  /**
   * Validate reset password form data
   */
  validateResetPassword: (data: unknown): ResetPasswordFormData => {
    return resetPasswordFormSchema.parse(data);
  },

  /**
   * Validate change password form data
   */
  validateChangePassword: (data: unknown): ChangePasswordFormData => {
    return changePasswordFormSchema.parse(data);
  },

  /**
   * Validate email verification form data
   */
  validateEmailVerification: (data: unknown): EmailVerificationFormData => {
    return emailVerificationFormSchema.parse(data);
  },

  /**
   * Validate update profile form data
   */
  validateUpdateProfile: (data: unknown): UpdateProfileFormData => {
    return updateProfileFormSchema.parse(data);
  },

  /**
   * Validate user invitation form data
   */
  validateUserInvitation: (data: unknown): UserInvitationFormData => {
    return userInvitationFormSchema.parse(data);
  },

  /**
   * Validate accept invitation form data
   */
  validateAcceptInvitation: (data: unknown): AcceptInvitationFormData => {
    return acceptInvitationFormSchema.parse(data);
  },

  /**
   * Safe validation methods
   */
  safeValidateLogin: (data: unknown) => loginFormSchema.safeParse(data),
  safeValidateSignup: (data: unknown) => signupFormSchema.safeParse(data),
  safeValidateForgotPassword: (data: unknown) => forgotPasswordFormSchema.safeParse(data),
  safeValidateResetPassword: (data: unknown) => resetPasswordFormSchema.safeParse(data),
  safeValidateChangePassword: (data: unknown) => changePasswordFormSchema.safeParse(data),
  safeValidateEmailVerification: (data: unknown) => emailVerificationFormSchema.safeParse(data),
  safeValidateUpdateProfile: (data: unknown) => updateProfileFormSchema.safeParse(data),
  safeValidateUserInvitation: (data: unknown) => userInvitationFormSchema.safeParse(data),
  safeValidateAcceptInvitation: (data: unknown) => acceptInvitationFormSchema.safeParse(data),

  /**
   * Transform signup data for user creation
   */
  transformForSignup: (data: SignupFormData) => {
    return {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password, // Password should already be hashed by auth system
    };
  },

  /**
   * Transform profile update data
   */
  transformForProfileUpdate: (data: UpdateProfileFormData) => {
    return {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
    };
  },

  /**
   * Transform invitation data for database
   */
  transformForInvitation: (data: UserInvitationFormData) => {
    return {
      email: data.email.toLowerCase().trim(),
      role: data.role,
    };
  },
};

// Default values for forms
export const authDefaultValues = {
  login: {
    email: '',
    password: '',
    rememberMe: false,
  },
  signup: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  },
  forgotPassword: {
    email: '',
  },
  resetPassword: {
    token: '',
    password: '',
    confirmPassword: '',
  },
  changePassword: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
  emailVerification: {
    token: '',
  },
  updateProfile: {
    name: '',
    email: '',
  },
  userInvitation: {
    email: '',
    role: 'user' as const,
  },
  acceptInvitation: {
    token: '',
    name: '',
    password: '',
    confirmPassword: '',
  },
};

// Error messages specific to authentication
export const authErrorMessages = {
  loginFailed: 'Invalid email or password',
  emailNotVerified: 'Please verify your email address',
  accountDisabled: 'Your account has been disabled',
  tooManyAttempts: 'Too many login attempts. Please try again later',
  signupFailed: 'Failed to create account',
  emailAlreadyExists: 'An account with this email already exists',
  invitationExpired: 'Invitation has expired',
  invitationAlreadyUsed: 'Invitation has already been used',
  invalidInvitationToken: 'Invalid invitation token',
  passwordTooWeak: 'Password is too weak',
  currentPasswordIncorrect: 'Current password is incorrect',
  emailNotFound: 'No account found with this email',
  resetTokenExpired: 'Password reset token has expired',
  invalidResetToken: 'Invalid password reset token',
  profileUpdateFailed: 'Failed to update profile',
  unauthorized: 'You are not authorized to perform this action',
};