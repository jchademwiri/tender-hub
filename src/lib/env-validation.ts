import { z } from "zod";

// Environment validation schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Better Auth Configuration
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),

  // Email Configuration
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  // Session Configuration (optional with defaults)
  SESSION_EXPIRES_IN: z.coerce.number().positive().default(604800), // 7 days
  SESSION_UPDATE_AGE: z.coerce.number().positive().default(86400), // 1 day
  SESSION_FRESH_AGE: z.coerce.number().positive().default(300), // 5 minutes

  // Rate Limiting Configuration (optional with defaults)
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().positive().default(100),
  RATE_LIMIT_SIGNIN_MAX: z.coerce.number().positive().default(3),
  RATE_LIMIT_SIGNUP_MAX: z.coerce.number().positive().default(3),
  RATE_LIMIT_PASSWORD_RESET_MAX: z.coerce.number().positive().default(2),
  RATE_LIMIT_API_MAX: z.coerce.number().positive().default(50),

  // Optional Monitoring
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Database Pool Configuration (optional with defaults)
  DATABASE_POOL_MIN: z.coerce.number().nonnegative().default(2),
  DATABASE_POOL_MAX: z.coerce.number().positive().default(10),
  DATABASE_POOL_IDLE_TIMEOUT: z.coerce.number().positive().default(30000),

  // Security Configuration (optional)
  CSRF_SECRET: z.string().min(32).optional(),

  // Audit Logging (optional with defaults)
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().positive().default(90),
  AUDIT_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Performance Monitoring (optional with defaults)
  PERFORMANCE_MONITORING_ENABLED: z.coerce.boolean().default(true),
  PERFORMANCE_THRESHOLD_MS: z.coerce.number().positive().default(500),

  // Cache Configuration (optional with defaults)
  CACHE_TTL_DEFAULT: z.coerce.number().positive().default(300),
  CACHE_TTL_PUBLISHERS: z.coerce.number().positive().default(1800),
  CACHE_TTL_PROVINCES: z.coerce.number().positive().default(3600),

  // Email Configuration (optional)
  EMAIL_TEMPLATE_VERSION: z.string().default("v1"),
  EMAIL_BRANDING_LOGO_URL: z.string().url().optional(),
  EMAIL_SUPPORT_EMAIL: z.string().email().optional(),

  // Health Check Configuration (optional with defaults)
  HEALTH_CHECK_TIMEOUT: z.coerce.number().positive().default(5000),
  HEALTH_CHECK_DATABASE_ENABLED: z.coerce.boolean().default(true),
  HEALTH_CHECK_EMAIL_ENABLED: z.coerce.boolean().default(true),

  // Backup Configuration (optional with defaults)
  BACKUP_ENABLED: z.coerce.boolean().default(false),
  BACKUP_RETENTION_DAYS: z.coerce.number().positive().default(30),
  BACKUP_SCHEDULE: z.string().optional(),

  // Feature Flags (optional with defaults)
  FEATURE_BULK_INVITATIONS: z.coerce.boolean().default(true),
  FEATURE_ADVANCED_ANALYTICS: z.coerce.boolean().default(true),
  FEATURE_AUDIT_DASHBOARD: z.coerce.boolean().default(true),
  FEATURE_DEBUG_MODE: z.coerce.boolean().default(false),

  // Testing Configuration (optional)
  TEST_MODE: z.string().optional(),
  ALLOW_TEST_USERS: z.coerce.boolean().default(false),
  MOCK_EMAIL_DELIVERY: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);

    // Additional validation logic
    if (env.NODE_ENV === "production") {
      // Ensure critical production settings
      if (!env.SENTRY_DSN) {
        console.warn("Warning: SENTRY_DSN not configured for production");
      }

      if (!env.CSRF_SECRET) {
        console.warn("Warning: CSRF_SECRET not configured for production");
      }

      if (env.BETTER_AUTH_SECRET.includes("REPLACE_WITH")) {
        throw new Error(
          "Production secrets must be replaced with actual values",
        );
      }

      if (env.RESEND_API_KEY.includes("REPLACE_WITH")) {
        throw new Error(
          "Production API keys must be replaced with actual values",
        );
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`,
      );
      throw new Error(
        `Environment validation failed:\n${errorMessages.join("\n")}`,
      );
    }
    throw error;
  }
}

// Export validated environment configuration
export const env = validateEnv();

// Helper functions for common environment checks
export const isProduction = () => env.NODE_ENV === "production";
export const isDevelopment = () => env.NODE_ENV === "development";
export const isTest = () => env.NODE_ENV === "test";

// Feature flag helpers
export const features = {
  bulkInvitations: env.FEATURE_BULK_INVITATIONS,
  advancedAnalytics: env.FEATURE_ADVANCED_ANALYTICS,
  auditDashboard: env.FEATURE_AUDIT_DASHBOARD,
  debugMode: env.FEATURE_DEBUG_MODE,
} as const;

// Rate limit configuration
export const rateLimits = {
  global: { window: 60, max: env.RATE_LIMIT_GLOBAL_MAX },
  signIn: { window: 60, max: env.RATE_LIMIT_SIGNIN_MAX },
  signUp: { window: 300, max: env.RATE_LIMIT_SIGNUP_MAX },
  passwordReset: { window: 900, max: env.RATE_LIMIT_PASSWORD_RESET_MAX },
  api: { window: 60, max: env.RATE_LIMIT_API_MAX },
} as const;

// Session configuration
export const sessionConfig = {
  expiresIn: env.SESSION_EXPIRES_IN,
  updateAge: env.SESSION_UPDATE_AGE,
  freshAge: env.SESSION_FRESH_AGE,
} as const;

// Cache configuration
export const cacheConfig = {
  default: env.CACHE_TTL_DEFAULT,
  publishers: env.CACHE_TTL_PUBLISHERS,
  provinces: env.CACHE_TTL_PROVINCES,
} as const;

// Database configuration
export const dbConfig = {
  url: env.DATABASE_URL,
  pool: {
    min: env.DATABASE_POOL_MIN,
    max: env.DATABASE_POOL_MAX,
    idleTimeout: env.DATABASE_POOL_IDLE_TIMEOUT,
  },
} as const;

// Email configuration
export const emailConfig = {
  apiKey: env.RESEND_API_KEY,
  from: env.EMAIL_FROM,
  templateVersion: env.EMAIL_TEMPLATE_VERSION,
  brandingLogoUrl: env.EMAIL_BRANDING_LOGO_URL,
  supportEmail: env.EMAIL_SUPPORT_EMAIL,
} as const;

// Health check configuration
export const healthCheckConfig = {
  timeout: env.HEALTH_CHECK_TIMEOUT,
  database: env.HEALTH_CHECK_DATABASE_ENABLED,
  email: env.HEALTH_CHECK_EMAIL_ENABLED,
} as const;
