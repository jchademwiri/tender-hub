import { z } from "zod";

/**
 * Common validation patterns and utilities for the application
 */

// Basic string validations
export const stringValidations = {
  required: (message = "This field is required") => z.string().min(1, message),

  optional: z.string().optional(),

  trimmed: (message = "This field is required") =>
    z
      .string()
      .transform((str) => str.trim())
      .pipe(z.string().min(1, message)),

  maxLength: (max: number, message?: string) =>
    z.string().max(max, message || `Must be ${max} characters or less`),

  minLength: (min: number, message?: string) =>
    z.string().min(min, message || `Must be at least ${min} characters`),

  lengthBetween: (min: number, max: number, message?: string) =>
    z.string().min(min, message).max(max, message),

  email: (message = "Invalid email address") => z.string().email(message),

  url: (message = "Invalid URL") => z.string().url(message).or(z.literal("")),

  uuid: (message = "Invalid ID format") => z.string().uuid(message),

  alphanumeric: (message = "Only letters and numbers allowed") =>
    z.string().regex(/^[a-zA-Z0-9]+$/, message),

  uppercase: (message = "Must be uppercase letters only") =>
    z.string().regex(/^[A-Z]+$/, message),

  phone: (message = "Invalid phone number") =>
    z.string().regex(/^[+]?[0-9\s\-()]+$/, message),
};

// Number validations
export const numberValidations = {
  positive: (message = "Must be a positive number") =>
    z.number().positive(message),

  nonNegative: (message = "Must be zero or greater") =>
    z.number().min(0, message),

  integer: (message = "Must be a whole number") => z.number().int(message),

  positiveInteger: (message = "Must be a positive whole number") =>
    z.number().int().positive(message),

  range: (min: number, max: number, message?: string) =>
    z.number().min(min, message).max(max, message),
};

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format");

// URL validation with optional empty string
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .or(z.literal(""))
  .optional()
  .transform((val) => (val === "" ? undefined : val));

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one lowercase letter, one uppercase letter, and one number",
  );

// Province code validation (2-3 uppercase letters)
export const provinceCodeSchema = z
  .string()
  .min(2, "Province code must be 2-3 characters")
  .max(3, "Province code must be 2-3 characters")
  .regex(/^[A-Z]+$/, "Province code must contain only uppercase letters")
  .transform((val) => val.toUpperCase());

// Name validation (for publishers, provinces, etc.)
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(255, "Name must be less than 255 characters")
  .trim()
  .regex(/^[^<>"'&]*$/, "Name contains invalid characters");

// Description validation (optional)
export const descriptionSchema = z
  .string()
  .max(1000, "Description must be less than 1000 characters")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? undefined : val?.trim()));

// Website validation
export const websiteSchema = z
  .string()
  .max(500, "Website URL must be less than 500 characters")
  .url("Invalid website URL")
  .or(z.literal(""))
  .optional()
  .transform((val) => (val === "" ? undefined : val));

// Common form data transformations
export const formDataTransforms = {
  trimString: (val: unknown) => {
    if (typeof val === "string") return val.trim();
    return val;
  },

  toUpperCase: (val: unknown) => {
    if (typeof val === "string") return val.toUpperCase();
    return val;
  },

  toLowerCase: (val: unknown) => {
    if (typeof val === "string") return val.toLowerCase();
    return val;
  },

  nullIfEmpty: (val: unknown) => {
    if (typeof val === "string" && val.trim() === "") return null;
    return val;
  },
};

// Error message helpers
export const errorMessages = {
  required: (field: string) => `${field} is required`,
  invalid: (field: string) => `Invalid ${field}`,
  tooShort: (field: string, min: number) =>
    `${field} must be at least ${min} characters`,
  tooLong: (field: string, max: number) =>
    `${field} must be ${max} characters or less`,
  invalidFormat: (field: string, format: string) =>
    `${field} must be in ${format} format`,
};

// Validation result types
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: z.ZodError;
    };

// Safe validation helper
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Format validation errors for display
export function formatValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join(".");
    formattedErrors[path] = err.message;
  });

  return formattedErrors;
}

// Check if validation errors contain specific field
export function hasFieldError(
  errors: Record<string, string>,
  field: string,
): boolean {
  return Object.keys(errors).some(
    (key) => key === field || key.startsWith(`${field}.`),
  );
}

// Get error message for specific field
export function getFieldError(
  errors: Record<string, string>,
  field: string,
): string | undefined {
  return errors[field];
}
