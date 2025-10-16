import { z } from 'zod';
import {
  nameSchema,
  websiteSchema,
  uuidSchema,
  errorMessages,
  formDataTransforms
} from './common';

/**
 * Publisher validation schemas
 */

// Base publisher schema for form data
export const publisherFormSchema = z.object({
  name: nameSchema,
  website: websiteSchema,
  province_id: uuidSchema,
});

// Publisher creation schema (for server actions)
export const createPublisherSchema = z.object({
  name: nameSchema,
  website: websiteSchema,
  province_id: uuidSchema,
});

// Publisher update schema (includes id)
export const updatePublisherSchema = z.object({
  id: uuidSchema,
  name: nameSchema,
  website: websiteSchema,
  province_id: uuidSchema,
});

// Publisher deletion schema
export const deletePublisherSchema = z.object({
  id: uuidSchema,
});

// Enhanced publisher schema with additional validations
export const publisherEnhancedSchema = z.object({
  id: uuidSchema.optional(),
  name: nameSchema
    .min(2, errorMessages.tooShort('Publisher name', 2))
    .max(100, errorMessages.tooLong('Publisher name', 100))
    .regex(/^[a-zA-Z0-9\s\-&.'()]+$/,
      'Publisher name can only contain letters, numbers, spaces, hyphens, ampersands, periods, apostrophes, and parentheses'),
  website: websiteSchema,
  province_id: uuidSchema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Type exports for TypeScript
export type PublisherFormData = z.infer<typeof publisherFormSchema>;
export type CreatePublisherData = z.infer<typeof createPublisherSchema>;
export type UpdatePublisherData = z.infer<typeof updatePublisherSchema>;
export type DeletePublisherData = z.infer<typeof deletePublisherSchema>;
export type PublisherEnhancedData = z.infer<typeof publisherEnhancedSchema>;

// Validation helpers
export const publisherValidationHelpers = {
  /**
   * Validate publisher form data
   */
  validateForm: (data: unknown): PublisherFormData => {
    return publisherFormSchema.parse(data);
  },

  /**
   * Validate publisher creation data
   */
  validateCreate: (data: unknown): CreatePublisherData => {
    return createPublisherSchema.parse(data);
  },

  /**
   * Validate publisher update data
   */
  validateUpdate: (data: unknown): UpdatePublisherData => {
    return updatePublisherSchema.parse(data);
  },

  /**
   * Validate publisher deletion data
   */
  validateDelete: (data: unknown): DeletePublisherData => {
    return deletePublisherSchema.parse(data);
  },

  /**
   * Safe validation for form data (returns result object)
   */
  safeValidateForm: (data: unknown) => {
    return publisherFormSchema.safeParse(data);
  },

  /**
   * Safe validation for creation data
   */
  safeValidateCreate: (data: unknown) => {
    return createPublisherSchema.safeParse(data);
  },

  /**
   * Safe validation for update data
   */
  safeValidateUpdate: (data: unknown) => {
    return updatePublisherSchema.safeParse(data);
  },

  /**
   * Safe validation for deletion data
   */
  safeValidateDelete: (data: unknown) => {
    return deletePublisherSchema.safeParse(data);
  },

  /**
   * Transform form data for database insertion
   */
  transformForCreate: (data: PublisherFormData) => {
    return {
      name: formDataTransforms.trimString(data.name),
      website: formDataTransforms.nullIfEmpty(data.website),
      province_id: data.province_id,
    };
  },

  /**
   * Transform form data for database update
   */
  transformForUpdate: (data: UpdatePublisherData) => {
    return {
      id: data.id,
      name: formDataTransforms.trimString(data.name),
      website: formDataTransforms.nullIfEmpty(data.website),
      province_id: data.province_id,
    };
  },

  /**
   * Validate and transform form data in one step
   */
  validateAndTransformForCreate: (data: unknown) => {
    const validatedData = publisherValidationHelpers.validateForm(data);
    return publisherValidationHelpers.transformForCreate(validatedData);
  },

  /**
   * Validate and transform form data for update in one step
   */
  validateAndTransformForUpdate: (data: unknown) => {
    const validatedData = publisherValidationHelpers.validateUpdate(data);
    return publisherValidationHelpers.transformForUpdate(validatedData);
  },
};

// Default values for forms
export const publisherDefaultValues: Partial<PublisherFormData> = {
  name: '',
  website: '',
  province_id: '',
};

// Error messages specific to publishers
export const publisherErrorMessages = {
  nameRequired: 'Publisher name is required',
  nameTooShort: 'Publisher name must be at least 2 characters',
  nameTooLong: 'Publisher name must be less than 100 characters',
  nameInvalid: 'Publisher name contains invalid characters',
  websiteInvalid: 'Please enter a valid website URL',
  provinceRequired: 'Please select a province',
  publisherNotFound: 'Publisher not found',
  duplicateName: 'A publisher with this name already exists',
  creationFailed: 'Failed to create publisher',
  updateFailed: 'Failed to update publisher',
  deleteFailed: 'Failed to delete publisher',
};