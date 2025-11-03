"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.withScope((scope) => {
      scope.setTag("error_boundary", true);
      scope.setContext("error_info", {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      });
      Sentry.captureException(error);
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">
        Something went wrong
      </h2>
      
      <p className="mb-6 max-w-md text-gray-600">
        We're sorry, but something unexpected happened. The error has been
        reported and we'll look into it.
      </p>

      {process.env.NODE_ENV === "development" && (
        <details className="mb-6 max-w-2xl">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error Details (Development Only)
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-left text-xs text-gray-800">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex gap-4">
        <Button onClick={resetError} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        
        <Button
          onClick={() => window.location.reload()}
          variant="default"
        >
          Reload Page
        </Button>
      </div>
    </div>
  );
}

/**
 * Hook for handling async errors in components
 */
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    Sentry.withScope((scope) => {
      scope.setTag("async_error", true);
      if (errorInfo) {
        scope.setContext("error_info", errorInfo);
      }
      Sentry.captureException(error);
    });
  }, []);
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * Error boundary specifically for API errors
 */
export function APIErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        Sentry.withScope((scope) => {
          scope.setTag("error_type", "api");
          scope.setContext("api_error_info", {
            componentStack: errorInfo.componentStack,
          });
          Sentry.captureException(error);
        });
      }}
      fallback={({ error, resetError }) => (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="ml-2 text-sm font-medium text-red-800">
              API Error
            </h3>
          </div>
          <p className="mt-2 text-sm text-red-700">
            Failed to load data. Please try again.
          </p>
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for form components
 */
export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        Sentry.withScope((scope) => {
          scope.setTag("error_type", "form");
          scope.setContext("form_error_info", {
            componentStack: errorInfo.componentStack,
          });
          Sentry.captureException(error);
        });
      }}
      fallback={({ error, resetError }) => (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="ml-2 text-sm font-medium text-yellow-800">
              Form Error
            </h3>
          </div>
          <p className="mt-2 text-sm text-yellow-700">
            There was an error with the form. Please refresh and try again.
          </p>
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Form
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}