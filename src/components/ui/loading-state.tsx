import { Loader2, RefreshCw } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  variant?: "spinner" | "skeleton" | "pulse";
  size?: "sm" | "md" | "lg";
  className?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  rows?: number; // For skeleton variant
}

export function LoadingState({
  message = "Loading...",
  variant = "spinner",
  size = "md",
  className,
  showRetry = false,
  onRetry,
  rows = 3,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8",
        className,
      )}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
      />
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">{message}</p>
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

// Specific loading components for common use cases
export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size],
        className,
      )}
    />
  );
}

export function LoadingButton({
  children,
  loading,
  ...props
}: { children: React.ReactNode; loading?: boolean } & React.ComponentProps<
  typeof Button
>) {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {children}
    </Button>
  );
}

export function LoadingOverlay({
  children,
  loading,
  message,
}: {
  children: React.ReactNode;
  loading?: boolean;
  message?: string;
}) {
  if (!loading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-md">
        <LoadingState message={message} size="sm" />
      </div>
    </div>
  );
}
