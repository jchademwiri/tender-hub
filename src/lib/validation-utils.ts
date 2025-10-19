import { z } from "zod";
import {
  classifyError,
  createAppError,
  getUserFriendlyMessage,
  logError,
} from "./error-utils";
import { formatValidationErrors, getFieldError } from "./validations/common";

/**
 * Validation utilities for forms and server actions
 */

// Generic validation result type
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: Record<string, string>;
      error: z.ZodError;
    };

// Form field validation state
export interface FieldValidationState {
  isValid: boolean;
  error?: string;
  isDirty: boolean;
  isTouched: boolean;
}

// Form validation state
export interface FormValidationState {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
  touchedFields: Set<string>;
}

/**
 * Validate data against a Zod schema and return user-friendly results
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatValidationErrors(error);

      // Log validation errors for debugging
      logError(
        createAppError(`Validation failed${context ? ` for ${context}` : ""}`, {
          code: "VALIDATION_ERROR",
          statusCode: 400,
          details: {
            errors: formattedErrors,
            context,
            originalError: error,
          },
        }),
        "medium",
      );

      return {
        success: false,
        errors: formattedErrors,
        error,
      };
    }
    throw error;
  }
}

/**
 * Validate form data and throw AppError on failure
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T {
  const result = validateWithSchema(schema, data, context);

  if (!result.success) {
    const error = createAppError(
      `Validation failed${context ? ` for ${context}` : ""}`,
      {
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: {
          errors: result.errors,
          context,
        },
      },
    );
    logError(error, classifyError(error));
    throw error;
  }

  return result.data;
}

/**
 * Create field validation state
 */
export function createFieldState(
  fieldName: string,
  formErrors: Record<string, string>,
  touchedFields: Set<string>,
): FieldValidationState {
  const error = getFieldError(formErrors, fieldName);
  const isTouched = touchedFields.has(fieldName);

  return {
    isValid: !error,
    error,
    isDirty: isTouched,
    isTouched,
  };
}

/**
 * Create form validation state
 */
export function createFormState(
  isDirty: boolean,
  isSubmitting: boolean,
  errors: Record<string, string>,
  touchedFields: Set<string>,
): FormValidationState {
  return {
    isValid: Object.keys(errors).length === 0,
    isDirty,
    isSubmitting,
    errors,
    touchedFields,
  };
}

/**
 * Extract validation errors from form state for display
 */
export function getFormValidationErrors(formState: {
  errors: Record<string, string[]>;
}): Record<string, string> {
  const validationErrors: Record<string, string> = {};

  Object.entries(formState.errors).forEach(([field, fieldErrors]) => {
    if (fieldErrors && fieldErrors.length > 0) {
      validationErrors[field] = fieldErrors[0]; // Take first error message
    }
  });

  return validationErrors;
}

/**
 * Check if form has any validation errors
 */
export function hasFormErrors(formState: {
  errors: Record<string, string[]>;
}): boolean {
  return Object.values(formState.errors).some(
    (errors) => errors && errors.length > 0,
  );
}

/**
 * Get all validation error messages as an array
 */
export function getAllErrorMessages(formState: {
  errors: Record<string, string[]>;
}): string[] {
  return Object.values(formState.errors)
    .filter((errors) => errors && errors.length > 0)
    .flat();
}

/**
 * Validate server action data and return appropriate response
 */
export function validateServerAction<T>(
  schema: z.ZodSchema<T>,
  formData: FormData | Record<string, any>,
  context?: string,
): { success: true; data: T } | { success: false; error: string } {
  try {
    // Convert FormData to plain object if needed
    const data =
      formData instanceof FormData
        ? Object.fromEntries(formData.entries())
        : formData;

    const result = validateWithSchema(schema, data, context);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: getUserFriendlyMessage(
          createAppError("Validation failed", {
            code: "VALIDATION_ERROR",
            statusCode: 400,
            details: { errors: result.errors },
          }),
        ),
      };
    }
  } catch (error) {
    const appError = createAppError(
      `Server validation error${context ? ` for ${context}` : ""}`,
      {
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: { originalError: error, context },
      },
    );
    logError(appError, classifyError(appError));

    return {
      success: false,
      error: getUserFriendlyMessage(appError),
    };
  }
}

/**
 * Transform FormData for validation (handle common data type conversions)
 */
export function transformFormData(formData: FormData): Record<string, any> {
  const transformed: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    // Handle empty strings
    if (value === "") {
      transformed[key] = null;
      continue;
    }

    // Handle numeric values
    if (/^\d+$/.test(value as string)) {
      transformed[key] = Number(value);
      continue;
    }

    // Handle boolean values
    if (value === "true" || value === "false") {
      transformed[key] = value === "true";
      continue;
    }

    // Handle arrays (for multiple select values)
    if (transformed[key]) {
      if (Array.isArray(transformed[key])) {
        transformed[key].push(value);
      } else {
        transformed[key] = [transformed[key], value];
      }
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}

/**
 * Create validation middleware for server actions
 */
export function withValidation<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (data: TInput) => Promise<TOutput>,
  context?: string,
) {
  return async (formData: FormData | Record<string, any>): Promise<TOutput> => {
    const validation = validateServerAction(schema, formData, context);

    if (!validation.success) {
      throw createAppError(validation.error, {
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
    }

    return handler(validation.data);
  };
}

/**
 * Debounced validation for real-time form validation
 */
export function createDebouncedValidator<T>(
  schema: z.ZodSchema<T>,
  delay: number = 300,
) {
  let timeoutId: NodeJS.Timeout;

  return (data: unknown): Promise<ValidationResult<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validateWithSchema(schema, data));
      }, delay);
    });
  };
}

/**
 * Validate array of items against schema
 */
export function validateArray<T>(
  schema: z.ZodSchema<T>,
  items: unknown[],
  context?: string,
):
  | { success: true; data: T[] }
  | {
      success: false;
      errors: Array<{ index: number; errors: Record<string, string> }>;
    } {
  const results: T[] = [];
  const errors: Array<{ index: number; errors: Record<string, string> }> = [];

  items.forEach((item, index) => {
    const result = validateWithSchema(schema, item, `${context} item ${index}`);

    if (result.success) {
      results.push(result.data);
    } else {
      errors.push({ index, errors: result.errors });
    }
  });

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: results };
}

/**
 * Merge multiple validation results
 */
export function mergeValidationResults<T>(
  results: ValidationResult<T>[],
): ValidationResult<T[]> {
  const data: T[] = [];
  const allErrors: Record<string, string> = {};

  results.forEach((result, index) => {
    if (result.success) {
      data.push(result.data);
    } else {
      // Prefix error keys with array index
      Object.entries(result.errors).forEach(([key, message]) => {
        allErrors[`${index}.${key}`] = message;
      });
    }
  });

  if (Object.keys(allErrors).length > 0) {
    return {
      success: false,
      errors: allErrors,
      error: results.find((r) => !r.success)?.error!,
    };
  }

  return { success: true, data };
}

/**
 * Create validation schema for partial updates (optional fields)
 */
export function createPartialSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  return schema.partial();
}

/**
 * Validate and sanitize HTML content (basic protection against XSS)
 */
export function validateHtmlContent(
  content: string,
  maxLength: number = 10000,
): string {
  if (typeof content !== "string") {
    throw createAppError("Content must be a string", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
  }

  if (content.length > maxLength) {
    throw createAppError(`Content must be ${maxLength} characters or less`, {
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
  }

  // Basic HTML sanitization - remove script tags and dangerous attributes
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

/**
 * Validation utility for file uploads
 */
export function validateFileUpload(
  file: File | null,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  } = {},
): { success: true; file: File } | { success: false; error: string } {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypes = [],
    required = false,
  } = options;

  if (required && !file) {
    return { success: false, error: "File is required" };
  }

  if (!file) {
    return { success: true, file: file as any };
  }

  if (maxSize && file.size > maxSize) {
    return {
      success: false,
      error: `File size must be ${Math.round(maxSize / 1024 / 1024)}MB or less`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type must be one of: ${allowedTypes.join(", ")}`,
    };
  }

  return { success: true, file };
}
