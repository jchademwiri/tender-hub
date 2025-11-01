import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleValidationError } from "./api-error-handler";

/**
 * Validation middleware for API routes
 */

export interface ValidationConfig<TBody = any, TQuery = any, TParams = any> {
  body?: z.ZodSchema<TBody>;
  query?: z.ZodSchema<TQuery>;
  params?: z.ZodSchema<TParams>;
}

export interface ValidatedRequest<TBody = any, TQuery = any, TParams = any> extends NextRequest {
  validatedBody?: TBody;
  validatedQuery?: TQuery;
  validatedParams?: TParams;
}

/**
 * Validate request body, query parameters, and route parameters
 */
export async function validateRequest<TBody = any, TQuery = any, TParams = any>(
  request: NextRequest,
  config: ValidationConfig<TBody, TQuery, TParams>,
  params?: any
): Promise<{
  success: true;
  validatedBody?: TBody;
  validatedQuery?: TQuery;
  validatedParams?: TParams;
} | {
  success: false;
  response: NextResponse;
}> {
  try {
    let validatedBody: TBody | undefined;
    let validatedQuery: TQuery | undefined;
    let validatedParams: TParams | undefined;

    // Validate request body
    if (config.body) {
      try {
        const body = await request.json();
        const bodyValidation = config.body.safeParse(body);
        
        if (!bodyValidation.success) {
          return {
            success: false,
            response: handleValidationError(bodyValidation.error)
          };
        }
        
        validatedBody = bodyValidation.data;
      } catch (error) {
        // Handle JSON parsing errors
        const jsonError = new z.ZodError([{
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON in request body",
          path: ["body"]
        }]);
        
        return {
          success: false,
          response: handleValidationError(jsonError)
        };
      }
    }

    // Validate query parameters
    if (config.query) {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      
      const queryValidation = config.query.safeParse(queryParams);
      
      if (!queryValidation.success) {
        return {
          success: false,
          response: handleValidationError(queryValidation.error)
        };
      }
      
      validatedQuery = queryValidation.data;
    }

    // Validate route parameters
    if (config.params && params) {
      const paramsValidation = config.params.safeParse(params);
      
      if (!paramsValidation.success) {
        return {
          success: false,
          response: handleValidationError(paramsValidation.error)
        };
      }
      
      validatedParams = paramsValidation.data;
    }

    return {
      success: true,
      validatedBody,
      validatedQuery,
      validatedParams
    };

  } catch (error) {
    console.error("Validation middleware error:", error);
    
    const validationError = new z.ZodError([{
      code: z.ZodIssueCode.custom,
      message: "Request validation failed",
      path: ["request"]
    }]);
    
    return {
      success: false,
      response: handleValidationError(validationError)
    };
  }
}

/**
 * Higher-order function to create validated API route handlers
 */
export function withValidation<TBody = any, TQuery = any, TParams = any>(
  config: ValidationConfig<TBody, TQuery, TParams>
) {
  return function <TContext = any>(
    handler: (
      request: NextRequest,
      context: TContext & {
        validatedBody?: TBody;
        validatedQuery?: TQuery;
        validatedParams?: TParams;
      }
    ) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: TContext): Promise<NextResponse> => {
      // Extract params from context if available
      const params = (context as any)?.params;
      
      const validation = await validateRequest(request, config, params);
      
      if (!validation.success) {
        return validation.response;
      }

      // Add validated data to context
      const enhancedContext = {
        ...context,
        validatedBody: validation.validatedBody,
        validatedQuery: validation.validatedQuery,
        validatedParams: validation.validatedParams,
      };

      return handler(request, enhancedContext);
    };
  };
}

/**
 * Utility functions for common validation patterns
 */

/**
 * Validate UUID parameter
 */
export function validateUuidParam(paramValue: string, paramName: string = "id"): {
  success: true;
  id: string;
} | {
  success: false;
  response: NextResponse;
} {
  const uuidSchema = z.string().uuid(`Invalid ${paramName} format`);
  const validation = uuidSchema.safeParse(paramValue);
  
  if (!validation.success) {
    return {
      success: false,
      response: handleValidationError(validation.error)
    };
  }
  
  return {
    success: true,
    id: validation.data
  };
}

/**
 * Validate pagination query parameters
 */
export function validatePaginationQuery(searchParams: URLSearchParams): {
  success: true;
  pagination: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder: "asc" | "desc";
    search?: string;
  };
} | {
  success: false;
  response: NextResponse;
} {
  const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    search: z.string().optional(),
  });

  const queryParams = Object.fromEntries(searchParams.entries());
  const validation = paginationSchema.safeParse(queryParams);
  
  if (!validation.success) {
    return {
      success: false,
      response: handleValidationError(validation.error)
    };
  }
  
  return {
    success: true,
    pagination: validation.data
  };
}

/**
 * Validate date range query parameters
 */
export function validateDateRangeQuery(searchParams: URLSearchParams): {
  success: true;
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  };
} | {
  success: false;
  response: NextResponse;
} {
  const dateRangeSchema = z.object({
    startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["dateRange"]
    }
  );

  const queryParams = Object.fromEntries(searchParams.entries());
  const validation = dateRangeSchema.safeParse(queryParams);
  
  if (!validation.success) {
    return {
      success: false,
      response: handleValidationError(validation.error)
    };
  }
  
  return {
    success: true,
    dateRange: validation.data
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): {
  success: true;
  email: string;
} | {
  success: false;
  response: NextResponse;
} {
  const emailSchema = z.string().email("Invalid email format");
  const validation = emailSchema.safeParse(email);
  
  if (!validation.success) {
    return {
      success: false,
      response: handleValidationError(validation.error)
    };
  }
  
  return {
    success: true,
    email: validation.data
  };
}

/**
 * Validate array of UUIDs
 */
export function validateUuidArray(
  uuids: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    fieldName?: string;
  } = {}
): {
  success: true;
  uuids: string[];
} | {
  success: false;
  response: NextResponse;
} {
  const {
    minLength = 1,
    maxLength = 100,
    fieldName = "IDs"
  } = options;

  const uuidArraySchema = z
    .array(z.string().uuid("Invalid UUID format"))
    .min(minLength, `At least ${minLength} ${fieldName} required`)
    .max(maxLength, `Too many ${fieldName} (max ${maxLength})`);

  const validation = uuidArraySchema.safeParse(uuids);
  
  if (!validation.success) {
    return {
      success: false,
      response: handleValidationError(validation.error)
    };
  }
  
  return {
    success: true,
    uuids: validation.data
  };
}

/**
 * Create a validation schema for enum values
 */
export function createEnumValidation<T extends readonly [string, ...string[]]>(
  enumValues: T,
  fieldName: string = "value"
) {
  return z.enum(enumValues, {
    message: `Invalid ${fieldName}. Must be one of: ${enumValues.join(", ")}`
  });
}

/**
 * Validate file upload (for future use)
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): {
  success: true;
  file: File;
} | {
  success: false;
  error: string;
} {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = []
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      success: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        success: false,
        error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`
      };
    }
  }

  return {
    success: true,
    file
  };
}