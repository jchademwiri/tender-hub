"use client"

import * as React from "react"
import { memo, useMemo, useCallback } from "react"
import { VisitedBadge } from "@/components/ui/visited-badge"
import { getVisitStats, getVisitedPagesForSession, getAllVisits } from "@/lib/visit-utils"
import { getCachedLocalStorage } from "@/lib/performance-utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface PublisherVisitBadgeProps {
  /** Publisher ID or unique identifier */
  publisherId: string
  /** Publisher name for display */
  publisherName?: string
  /** Custom className for the badge */
  className?: string
  /** Size of the badge */
  size?: "sm" | "md" | "lg"
  /** Show visit count in tooltip */
  showCount?: boolean
  /** Show detailed visit information */
  showDetails?: boolean
}

/**
 * PublisherVisitBadge Component
 * Shows visit indicators specifically for publisher pages with detailed visit information
 */
const PublisherVisitBadge = memo(({
  publisherId,
  publisherName,
  className,
  size = "sm",
  showCount = true,
  showDetails = true,
}: PublisherVisitBadgeProps) => {
  // Generate publisher URL pattern for visit tracking
  const publisherUrl = useMemo(() => {
    return `/publishers/${publisherId}`
  }, [publisherId])

  // Memoized function to get all visits using cached localStorage
  const getAllVisitsCached = useCallback(() => {
    return getCachedLocalStorage('visit-tracker-visits', 5000) || []
  }, [])

  // Get visit statistics for this publisher
  const visitStats = useMemo(() => {
    const stats = getVisitStats()
    const visitCount = stats.visitCountByPage[publisherUrl] || 0

    // Find the most recent visit for this publisher
    const allVisits = getAllVisitsCached() as any[]
    let lastVisit: Date | null = null

    for (const day of allVisits) {
      for (const visit of day.visits) {
        if (visit.url === publisherUrl && (!lastVisit || visit.timestamp > lastVisit.getTime())) {
          lastVisit = new Date(visit.timestamp)
        }
      }
    }

    return {
      visitCount,
      lastVisit,
      isVisited: visitCount > 0,
    }
  }, [publisherUrl, getAllVisitsCached])

  // Memoized helper function to format time ago
  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }, [])

  // Memoized helper function to format last visit time
  const formatLastVisit = useCallback((date: Date): string => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const visitDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (visitDate.getTime() === today.getTime()) {
      // Today - show time
      return `Today ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`
    } else if (visitDate.getTime() === today.getTime() - 86400000) {
      // Yesterday
      return `Yesterday ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`
    } else {
      // Older - show date and time
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }, [])

  // Generate tooltip content
  const tooltipContent = useMemo(() => {
    if (!visitStats.isVisited) {
      return `${publisherName ? publisherName : 'Publisher'} not visited yet`
    }

    const parts = [`Visited ${visitStats.visitCount} time${visitStats.visitCount === 1 ? '' : 's'}`]

    if (showDetails && visitStats.lastVisit) {
      const timeAgo = formatTimeAgo(visitStats.lastVisit)
      const lastVisitFormatted = formatLastVisit(visitStats.lastVisit)
      parts.push(`Last visited: ${lastVisitFormatted} (${timeAgo})`)
    }

    return parts.join('\n')
  }, [visitStats, publisherName, showDetails, formatTimeAgo, formatLastVisit])

  if (!visitStats.isVisited && visitStats.visitCount === 0) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2">
          <VisitedBadge
            isVisited={visitStats.isVisited}
            visitCount={visitStats.visitCount}
            lastVisit={visitStats.lastVisit}
            size={size}
            showCount={showCount}
            className={cn(
              "transition-all duration-200",
              visitStats.isVisited && "ring-2 ring-primary/20",
              className
            )}
            ariaLabel={`${publisherName ? publisherName : 'Publisher'} ${visitStats.isVisited ? 'visited' : 'not visited'}${visitStats.visitCount > 0 ? ` ${visitStats.visitCount} times` : ''}`}
          />
          {showDetails && visitStats.visitCount > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              {visitStats.visitCount}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <div className="whitespace-pre-line">
          {tooltipContent}
        </div>
      </TooltipContent>
    </Tooltip>
  )
});

/**
 * PublisherVisitIndicator Component
 * Compact version for use in table cells or tight spaces
 */
export interface PublisherVisitIndicatorProps {
  publisherId: string;
  publisherName?: string;
  showCount?: boolean;
  className?: string;
}

export const PublisherVisitIndicator = memo(({
  publisherId,
  publisherName,
  showCount = true,
  className,
}: PublisherVisitIndicatorProps) => {
  return (
    <PublisherVisitBadge
      publisherId={publisherId}
      publisherName={publisherName}
      size="sm"
      showCount={showCount}
      showDetails={false}
      className={className}
    />
  )
});

export { PublisherVisitBadge };