import { z } from "zod";
import {
  descriptionSchema,
  errorMessages,
  formDataTransforms,
  nameSchema,
  provinceCodeSchema,
  uuidSchema,
} from "./common";

/**
 * Province validation schemas
 */

// Base province schema for form data
export const provinceFormSchema = z.object({
  name: nameSchema,
  code: provinceCodeSchema,
  description: z.string().optional().or(z.literal("")),
});

// Province creation schema (for server actions)
export const createProvinceSchema = z.object({
  name: nameSchema,
  code: provinceCodeSchema,
  description: descriptionSchema,
});

// Province update schema (includes id)
export const updateProvinceSchema = z.object({
  id: uuidSchema,
  name: nameSchema,
  code: provinceCodeSchema,
  description: descriptionSchema,
});

// Province deletion schema
export const deleteProvinceSchema = z.object({
  id: uuidSchema,
});

// Enhanced province schema with additional validations
export const provinceEnhancedSchema = z.object({
  id: uuidSchema.optional(),
  name: nameSchema
    .min(2, errorMessages.tooShort("Province name", 2))
    .max(100, errorMessages.tooLong("Province name", 100))
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "Province name can only contain letters, spaces, hyphens, and apostrophes",
    ),
  code: provinceCodeSchema,
  description: descriptionSchema.refine((val) => !val || val.length >= 10, {
    message: "Description must be at least 10 characters if provided",
  }),
  createdAt: z.date().optional(),
});

// Type exports for TypeScript
export type ProvinceFormData = z.infer<typeof provinceFormSchema>;
export type CreateProvinceData = z.infer<typeof createProvinceSchema>;
export type UpdateProvinceData = z.infer<typeof updateProvinceSchema>;
export type DeleteProvinceData = z.infer<typeof deleteProvinceSchema>;
export type ProvinceEnhancedData = z.infer<typeof provinceEnhancedSchema>;

// Validation helpers
export const provinceValidationHelpers = {
  /**
   * Validate province form data
   */
  validateForm: (data: unknown): ProvinceFormData => {
    return provinceFormSchema.parse(data);
  },

  /**
   * Validate province creation data
   */
  validateCreate: (data: unknown): CreateProvinceData => {
    return createProvinceSchema.parse(data);
  },

  /**
   * Validate province update data
   */
  validateUpdate: (data: unknown): UpdateProvinceData => {
    return updateProvinceSchema.parse(data);
  },

  /**
   * Validate province deletion data
   */
  validateDelete: (data: unknown): DeleteProvinceData => {
    return deleteProvinceSchema.parse(data);
  },

  /**
   * Safe validation for form data (returns result object)
   */
  safeValidateForm: (data: unknown) => {
    return provinceFormSchema.safeParse(data);
  },

  /**
   * Safe validation for creation data
   */
  safeValidateCreate: (data: unknown) => {
    return createProvinceSchema.safeParse(data);
  },

  /**
   * Safe validation for update data
   */
  safeValidateUpdate: (data: unknown) => {
    return updateProvinceSchema.safeParse(data);
  },

  /**
   * Safe validation for deletion data
   */
  safeValidateDelete: (data: unknown) => {
    return deleteProvinceSchema.safeParse(data);
  },

  /**
   * Transform form data for database insertion
   */
  transformForCreate: (data: ProvinceFormData) => {
    return {
      name: formDataTransforms.trimString(data.name),
      code: formDataTransforms.toUpperCase(data.code),
      description: formDataTransforms.nullIfEmpty(data.description),
    };
  },

  /**
   * Transform form data for database update
   */
  transformForUpdate: (data: UpdateProvinceData) => {
    return {
      id: data.id,
      name: formDataTransforms.trimString(data.name),
      code: formDataTransforms.toUpperCase(data.code),
      description: formDataTransforms.nullIfEmpty(data.description),
    };
  },

  /**
   * Validate and transform form data in one step for creation
   */
  validateAndTransformForCreate: (data: unknown) => {
    const validatedData = provinceValidationHelpers.validateForm(data);
    return provinceValidationHelpers.transformForCreate(validatedData);
  },

  /**
   * Validate and transform form data in one step for update
   */
  validateAndTransformForUpdate: (data: unknown) => {
    const validatedData = provinceValidationHelpers.validateUpdate(data);
    return provinceValidationHelpers.transformForUpdate(validatedData);
  },

  /**
   * Check if province code is unique (for server-side validation)
   */
  validateUniqueCode: (code: string, _excludeId?: string) => {
    // This would be used in server actions to check database uniqueness
    return z
      .string()
      .refine(
        async (_val) => {
          // This is a placeholder - actual implementation would check the database
          // For now, we'll just validate the format
          return true;
        },
        {
          message: "Province code must be unique",
        },
      )
      .parse(code);
  },
};

// Default values for forms
export const provinceDefaultValues: Partial<ProvinceFormData> = {
  name: "",
  code: "",
  description: "",
};

// Error messages specific to provinces
export const provinceErrorMessages = {
  nameRequired: "Province name is required",
  nameTooShort: "Province name must be at least 2 characters",
  nameTooLong: "Province name must be less than 100 characters",
  nameInvalid: "Province name contains invalid characters",
  codeRequired: "Province code is required",
  codeInvalid: "Province code must be 2-3 uppercase letters",
  codeTooShort: "Province code must be at least 2 characters",
  codeTooLong: "Province code must be no more than 3 characters",
  codeNotUnique: "Province code must be unique",
  descriptionTooShort: "Description must be at least 10 characters if provided",
  provinceNotFound: "Province not found",
  duplicateName: "A province with this name already exists",
  duplicateCode: "A province with this code already exists",
  creationFailed: "Failed to create province",
  updateFailed: "Failed to update province",
  deleteFailed: "Failed to delete province",
  cannotDeleteWithPublishers:
    "Cannot delete province that has associated publishers",
};
