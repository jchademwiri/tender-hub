import React from 'react';
import { FileX, Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'card';
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export function EmptyState({
  title = 'No data found',
  message = 'There are no items to display at the moment.',
  action,
  secondaryAction,
  icon,
  className,
  variant = 'default',
  showRefresh = false,
  onRefresh,
}: EmptyStateProps) {
  const defaultIcon = <FileX className="h-8 w-8 text-muted-foreground" />;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-4 text-sm text-muted-foreground', className)}>
        {icon || defaultIcon}
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          {message && <p className="text-xs opacity-90 mt-0.5">{message}</p>}
        </div>
        <div className="flex gap-2">
          {showRefresh && onRefresh && (
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-6 px-2">
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {action && (
            <Button size="sm" onClick={action.onClick} className="h-6 px-2">
              {action.label}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('text-center p-8 bg-card rounded-lg border', className)}>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-muted p-3">
            {icon || defaultIcon}
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
        <div className="flex gap-3 justify-center">
          {showRefresh && onRefresh && (
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.label}
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
          <div className="rounded-full bg-muted p-3">
            {icon || defaultIcon}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex gap-3 justify-center">
          {showRefresh && onRefresh && (
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Specific empty state components for common use cases
export function NoResultsEmptyState({
  searchQuery,
  onClearSearch,
  className
}: {
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      className={className}
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
      title="No results found"
      message={
        searchQuery
          ? `No items match "${searchQuery}". Try adjusting your search terms.`
          : 'No items match your current filters.'
      }
      action={onClearSearch ? {
        label: 'Clear Search',
        onClick: onClearSearch
      } : undefined}
    />
  );
}

export function NoDataEmptyState({
  title = 'No data available',
  message = 'There is no data to display at the moment.',
  action,
  className
}: {
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <EmptyState
      className={className}
      title={title}
      message={message}
      action={action}
    />
  );
}

export function CreateNewEmptyState({
  title = 'Get started',
  message = 'Create your first item to get started.',
  action,
  className
}: {
  title?: string;
  message?: string;
  action: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <EmptyState
      className={className}
      icon={<Plus className="h-8 w-8 text-muted-foreground" />}
      title={title}
      message={message}
      action={action}
    />
  );
}