"use client"

import * as React from "react"
import { TableRow, TableCell } from "@/components/ui/table"
import { PublisherVisitBadge } from "@/components/publisher-visit-badge"
import { getVisitStats } from "@/lib/visit-utils"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface TableRowWithVisitsProps {
  /** The publisher data */
  publisher: {
    id: string
    name: string
    website?: string | null
    provinceName?: string | null
    [key: string]: any
  }
  /** Column definitions */
  columns: Array<{
    key: string
    header: string | React.ReactNode
    render?: (value: any, item: any) => React.ReactNode
  }>
  /** Actions renderer */
  actions?: (item: any) => React.ReactNode
  /** Custom className for the row */
  className?: string
  /** Whether to highlight visited rows */
  highlightVisited?: boolean
  /** Whether to show visit indicators */
  showVisitIndicators?: boolean
}

/**
 * TableRowWithVisits Component
 * Enhanced table row that shows visit indicators and highlights visited publishers
 */
export function TableRowWithVisits({
  publisher,
  columns,
  actions,
  className,
  highlightVisited = true,
  showVisitIndicators = true,
}: TableRowWithVisitsProps) {
  // Helper function to get all visits from storage (defined first for dependency order)
  const getAllVisits = React.useCallback(() => {
    try {
      const visits = localStorage.getItem('visit-tracker-visits')
      return visits ? JSON.parse(visits) : []
    } catch {
      return []
    }
  }, [])

  // Generate publisher URL for visit tracking
  const publisherUrl = React.useMemo(() => {
    return `/publishers/${publisher.id}`
  }, [publisher.id])

  // Get visit information for this publisher
  const visitInfo = React.useMemo(() => {
    const stats = getVisitStats()
    const visitCount = stats.visitCountByPage[publisherUrl] || 0

    // Find the most recent visit for this publisher
    const allVisits = getAllVisits()
    let lastVisit: Date | null = null
    let isVisited = false

    for (const day of allVisits) {
      for (const visit of day.visits) {
        if (visit.url === publisherUrl) {
          isVisited = true
          if (!lastVisit || visit.timestamp > lastVisit.getTime()) {
            lastVisit = new Date(visit.timestamp)
          }
        }
      }
    }

    return {
      visitCount,
      lastVisit,
      isVisited,
    }
  }, [publisherUrl, getAllVisits])

  // Format last visit time for display
  const formatLastVisit = React.useCallback((date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Visited just now'
    if (diffInSeconds < 3600) return `Visited ${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `Visited ${Math.floor(diffInSeconds / 3600)} hours ago`
    return `Visited ${Math.floor(diffInSeconds / 86400)} days ago`
  }, [])

  // Generate row className based on visit status
  const rowClassName = React.useMemo(() => {
    return cn(
      "transition-colors duration-200",
      highlightVisited && visitInfo.isVisited && [
        "bg-primary/5 hover:bg-primary/10",
        "border-l-2 border-primary/30"
      ],
      !visitInfo.isVisited && "hover:bg-muted/50",
      className
    )
  }, [highlightVisited, visitInfo.isVisited, className])

  // Generate tooltip content for the entire row
  const rowTooltipContent = React.useMemo(() => {
    if (!visitInfo.isVisited) {
      return `${publisher.name} has not been visited yet`
    }

    const parts = [
      `${publisher.name}`,
      `Visited ${visitInfo.visitCount} time${visitInfo.visitCount === 1 ? '' : 's'}`
    ]

    if (visitInfo.lastVisit) {
      parts.push(formatLastVisit(visitInfo.lastVisit))
    }

    return parts.join('\n')
  }, [publisher.name, visitInfo, formatLastVisit])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TableRow className={rowClassName}>
          {columns.map((col) => (
            <TableCell key={col.key}>
              <div className="flex items-center gap-2">
                {col.render ? col.render((publisher as any)[col.key], publisher) : String((publisher as any)[col.key])}

                {/* Show visit indicator in the name column */}
                {col.key === 'name' && showVisitIndicators && (
                  <PublisherVisitBadge
                    publisherId={publisher.id}
                    publisherName={publisher.name}
                    size="sm"
                  />
                )}
              </div>
            </TableCell>
          ))}

          {/* Visit information column */}
          {showVisitIndicators && (
            <TableCell>
              <div className="flex items-center gap-2">
                <PublisherVisitBadge
                  publisherId={publisher.id}
                  publisherName={publisher.name}
                  size="sm"
                  showDetails={true}
                />
                {visitInfo.lastVisit && (
                  <span className="text-xs text-muted-foreground">
                    {formatLastVisit(visitInfo.lastVisit)}
                  </span>
                )}
              </div>
            </TableCell>
          )}

          {actions && <TableCell>{actions(publisher)}</TableCell>}
        </TableRow>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <div className="whitespace-pre-line">
          {rowTooltipContent}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * VisitedPublishersFilter Component
 * Filter component to show/hide visited vs unvisited publishers
 */
export interface VisitedPublishersFilterProps {
  /** Current filter state */
  filter: 'all' | 'visited' | 'unvisited'
  /** Filter change handler */
  onFilterChange: (filter: 'all' | 'visited' | 'unvisited') => void
  /** Number of visited publishers */
  visitedCount?: number
  /** Number of unvisited publishers */
  unvisitedCount?: number
}

export function VisitedPublishersFilter({
  filter,
  onFilterChange,
  visitedCount = 0,
  unvisitedCount = 0,
}: VisitedPublishersFilterProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium">Filter:</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onFilterChange('all')}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors",
            filter === 'all'
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          All ({visitedCount + unvisitedCount})
        </button>
        <button
          onClick={() => onFilterChange('visited')}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors",
            filter === 'visited'
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          Visited ({visitedCount})
        </button>
        <button
          onClick={() => onFilterChange('unvisited')}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors",
            filter === 'unvisited'
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          Unvisited ({unvisitedCount})
        </button>
      </div>
    </div>
  )
}