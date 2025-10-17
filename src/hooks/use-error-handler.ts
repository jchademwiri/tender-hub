'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  createAppError,
  logError,
  classifyError,
  getUserFriendlyMessage,
  retryWithBackoff,
  safeAsync,
  type AppError
} from '@/lib/error-utils';

interface UseErrorHandlerOptions {
  onError?: (error: AppError) => void;
  onRetry?: (error: AppError, attempt: number) => void;
  showToast?: boolean;
  redirectOnError?: string | false;
}

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  retryCount: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { onError, onRetry, showToast = false, redirectOnError } = options;
  const router = useRouter();

  const handleError = useCallback((error: AppError) => {
    logError(error, classifyError(error));

    if (onError) {
      onError(error);
    }

    if (redirectOnError && typeof redirectOnError === 'string') {
      router.push(redirectOnError);
    }
  }, [onError, redirectOnError, router]);

  const handleRetry = useCallback((error: AppError, attempt: number) => {
    if (onRetry) {
      onRetry(error, attempt);
    }
  }, [onRetry]);

  return { handleError, handleRetry };
}

export function useAsyncOperation<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Store the last operation for retry functionality
  const lastOperationRef = useRef<{
    operation: () => Promise<T>;
    options: Parameters<typeof execute>[1];
  } | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: AppError) => void;
      retryOptions?: Parameters<typeof retryWithBackoff>[1];
      signal?: AbortSignal;
    } = {}
  ) => {
    const { onSuccess, onError, retryOptions, signal } = options;

    // Store the operation for retry functionality
    lastOperationRef.current = { operation, options };

    // Cancel previous operation if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const currentSignal = signal || abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await retryWithBackoff(
        async () => {
          // Check if operation was cancelled
          if (currentSignal.aborted) {
            throw new Error('Operation cancelled');
          }
          return await operation();
        },
        {
          maxRetries: 2,
          shouldRetry: (error) => {
            const message = error.message.toLowerCase();
            // Don't retry cancelled operations or validation errors
            if (message.includes('cancelled') || message.includes('validation')) {
              return false;
            }
            return message.includes('network') || message.includes('timeout') || message.includes('connection');
          },
          onRetry: (error, attempt) => {
            setState(prev => ({ ...prev, retryCount: attempt }));
          },
          ...retryOptions,
        }
      );

      if (currentSignal.aborted) {
        return; // Operation was cancelled
      }

      setState({
        data: result,
        loading: false,
        error: null,
        retryCount: 0,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      if (currentSignal.aborted) {
        return; // Operation was cancelled
      }

      const appError = error instanceof Error && 'timestamp' in error
        ? error as AppError
        : createAppError(error as Error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
        retryCount: 0,
      }));

      logError(appError, classifyError(appError));

      if (onError) {
        onError(appError);
      }

      throw appError;
    }
  }, []);

  const retry = useCallback(async () => {
    if (!state.error || !lastOperationRef.current) {
      return;
    }

    // Re-run the last operation with the same options
    await execute(
      lastOperationRef.current.operation,
      lastOperationRef.current.options
    );
  }, [state.error, execute]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      retryCount: 0,
    });

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [initialData]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      loading: false,
    }));
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    cancel,
  };
}

export function useSafeAsync() {
  const safeExecute = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      errorMessage?: string;
      fallback?: T;
      shouldLog?: boolean;
    } = {}
  ): Promise<{ data?: T; error?: AppError }> => {
    return await safeAsync(operation, options);
  }, []);

  return { safeExecute };
}

// Hook for form error handling
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalErrorState] = useState<string>('');

  const setError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const setGlobalError = useCallback((message: string) => {
    setGlobalErrorState(message);
  }, []);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setGlobalErrorState('');
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleSubmitError = useCallback((error: unknown) => {
    clearErrors();

    if (error && typeof error === 'object' && 'error' in error) {
      const errorMessage = (error as { error: string }).error;

      // Try to parse field-specific errors
      if (errorMessage.includes('field')) {
        // This is a simplified parsing - in a real app you might have more structured error responses
        setGlobalErrorState(errorMessage);
      } else {
        setGlobalErrorState(errorMessage);
      }
    } else {
      setGlobalErrorState('An unexpected error occurred');
    }
  }, [clearErrors]);

  return {
    fieldErrors,
    globalError,
    setError,
    setGlobalError,
    clearErrors,
    clearFieldError,
    handleSubmitError,
    hasErrors: Object.keys(fieldErrors).length > 0 || !!globalError,
  };
}

// Hook for handling loading states with error recovery
export function useLoadingState(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<AppError | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const setLoadingError = useCallback((error: AppError) => {
    setLoading(false);
    setError(error);
  }, []);

  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    startLoading();

    try {
      const result = await operation();
      stopLoading();
      return result;
    } catch (error) {
      const appError = createAppError(error as Error);
      setLoadingError(appError);
      logError(appError, classifyError(appError));
      return null;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  const retryWithLoading = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!error) return null;

    return withLoading(operation);
  }, [error, withLoading]);

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading,
    retryWithLoading,
  };
}