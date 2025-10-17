import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showHomeButton?: boolean;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'card';
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  action,
  showHomeButton = false,
  onRetry,
  className,
  variant = 'default',
}: ErrorStateProps) {
  const handleRetry = () => {
    onRetry?.();
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3 p-3 text-sm text-destructive bg-destructive/10 rounded-md', className)}>
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          {message && <p className="text-xs opacity-90 mt-0.5">{message}</p>}
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={handleRetry} className="h-6 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('text-center p-8 bg-card rounded-lg border', className)}>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.label}
            </Button>
          )}
          {showHomeButton && (
            <Button variant="ghost" onClick={handleHome} className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('min-h-[400px] flex items-center justify-center p-8', className)}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.label}
            </Button>
          )}
          {showHomeButton && (
            <Button variant="ghost" onClick={handleHome} className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}