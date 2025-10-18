// Error handling utilities for the application

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  url?: string;
  userAgent?: string;
  stack?: string;
  cause?: Error;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorReport {
  error: AppError;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  breadcrumbs?: Array<{
    timestamp: Date;
    message: string;
    data?: Record<string, any>;
  }>;
}

// Error classification
export function classifyError(error: Error | AppError): ErrorSeverity {
  const message = error.message.toLowerCase();
  const errorName = 'name' in error ? error.name : '';

  // Critical errors
  if (
    message.includes('database connection') ||
    message.includes('authentication failed') ||
    message.includes('unauthorized') ||
    message.includes('payment failed') ||
    error instanceof TypeError && message.includes('undefined')
  ) {
    return 'critical';
  }

  // High severity errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('server error') ||
    message.includes('500') ||
    errorName === 'ValidationError'
  ) {
    return 'high';
  }

  // Medium severity errors
  if (
    message.includes('not found') ||
    message.includes('404') ||
    message.includes('validation') ||
    message.includes('invalid')
  ) {
    return 'medium';
  }

  // Default to low
  return 'low';
}

// Create standardized error object
export function createAppError(
  error: Error | string,
  context?: {
    code?: string;
    statusCode?: number;
    details?: Record<string, any>;
    userId?: string;
    url?: string;
    userAgent?: string;
  }
): AppError {
  const appError: AppError = {
    message: typeof error === 'string' ? error : error.message,
    timestamp: new Date(),
    stack: typeof error === 'object' && error.stack ? error.stack : undefined,
    cause: typeof error === 'object' ? error : undefined,
    ...context,
  };

  if (context?.url === undefined) {
    appError.url = typeof window !== 'undefined' ? window.location.href : undefined;
  }

  if (context?.userAgent === undefined) {
    appError.userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;
  }

  return appError;
}

// Error logging with different levels
export function logError(
  error: Error | AppError,
  severity: ErrorSeverity = classifyError(error),
  context?: Record<string, any>
) {
  const appError = error instanceof Error && !('timestamp' in error)
    ? createAppError(error)
    : error;

  const logData = {
    error: appError,
    severity,
    context,
    timestamp: new Date().toISOString(),
  };

  // Console logging based on severity
  switch (severity) {
    case 'critical':
      console.error('🚨 CRITICAL ERROR:', logData);
      break;
    case 'high':
      console.error('❌ HIGH SEVERITY ERROR:', logData);
      break;
    case 'medium':
      console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
      break;
    case 'low':
    default:
      console.info('ℹ️ LOW SEVERITY ERROR:', logData);
      break;
  }

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    reportErrorToService(logData as any);
  }

  return logData;
}

// Report error to external service (placeholder for Sentry, LogRocket, etc.)
async function reportErrorToService(errorReport: {
  error: AppError;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: string;
}) {
  try {
    // This is where you would integrate with your error reporting service
    // Examples: Sentry, LogRocket, Bugsnag, etc.

    // For now, we'll store in localStorage for debugging
    if (typeof window !== 'undefined') {
      const errors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      errors.push(errorReport);

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      localStorage.setItem('app-errors', JSON.stringify(errors));
    }
  } catch (reportingError) {
    console.error('Failed to report error to service:', reportingError);
  }
}

// Retry mechanism with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.1 * delay; // Add 10% jitter

      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError!;
}

// User-friendly error messages
export function getUserFriendlyMessage(error: Error | AppError): string {
  const message = typeof error === 'string' ? error : error.message;

  // Network errors
  if (message.includes('fetch') || message.includes('network')) {
    return 'Connection problem. Please check your internet and try again.';
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return 'Please log in to continue.';
  }

  // Permission errors
  if (message.includes('forbidden') || message.includes('permission')) {
    return 'You don\'t have permission to perform this action.';
  }

  // Not found errors
  if (message.includes('not found') || message.includes('404')) {
    return 'The requested item could not be found.';
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // Server errors
  if (message.includes('server error') || message.includes('500')) {
    return 'Server error occurred. Please try again later.';
  }

  // Database errors
  if (message.includes('database') || message.includes('connection')) {
    return 'Database connection issue. Please try again.';
  }

  // Default fallback
  return 'Something went wrong. Please try again.';
}

// Error boundary helper
export function handleErrorBoundary(error: Error, errorInfo: { componentStack: string }) {
  const appError = createAppError(error, {
    details: { componentStack: errorInfo.componentStack }
  });

  logError(appError, classifyError(appError), {
    type: 'react-error-boundary',
    componentStack: errorInfo.componentStack,
  });
}

// Async operation wrapper with error handling
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options: {
    errorMessage?: string;
    shouldLog?: boolean;
    fallback?: T;
  } = {}
): Promise<{ data?: T; error?: AppError }> {
  const { errorMessage, shouldLog = true, fallback } = options;

  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = errorMessage
      ? createAppError(errorMessage, { details: { originalError: error } })
      : createAppError(error as Error);

    if (shouldLog) {
      logError(appError, classifyError(appError));
    }

    return {
      error: appError,
      data: fallback,
    };
  }
}

// Development error utilities
export function getStoredErrors(): Array<{
  error: AppError;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: string;
}> {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem('app-errors') || '[]');
  } catch {
    return [];
  }
}

export function clearStoredErrors() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('app-errors');
  }
}