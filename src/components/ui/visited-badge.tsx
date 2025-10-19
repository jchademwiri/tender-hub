"use client";

import type * as React from "react";
import { memo, useCallback, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VisitedBadgeProps {
  /** Whether the page has been visited */
  isVisited?: boolean;
  /** Number of visits to this page */
  visitCount?: number;
  /** Timestamp of the last visit */
  lastVisit?: Date | number | null;
  /** Custom className for the badge */
  className?: string;
  /** Size of the badge */
  size?: "sm" | "md" | "lg";
  /** Show visit count in tooltip */
  showCount?: boolean;
  /** Custom tooltip content */
  tooltipContent?: React.ReactNode;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * VisitedBadge Component
 * Shows a small dot indicator for visited pages with tooltip showing visit information
 */
export const VisitedBadge = memo(
  ({
    isVisited = false,
    visitCount = 0,
    lastVisit = null,
    className,
    size = "sm",
    showCount = true,
    tooltipContent,
    ariaLabel,
  }: VisitedBadgeProps) => {
    // Memoize size classes to prevent recreation on every render
    const sizeClasses = useMemo(
      () => ({
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
      }),
      [],
    );

    // Memoize badge className to prevent unnecessary recalculations
    const badgeClassName = useMemo(
      () =>
        cn(
          "rounded-full transition-all duration-200",
          sizeClasses[size],
          isVisited ? "bg-primary shadow-sm" : "bg-muted-foreground/30",
          className,
        ),
      [sizeClasses, size, isVisited, className],
    );

    // Memoized helper function to format time ago
    const formatTimeAgo = useCallback((date: Date): string => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }, []);

    // Generate default tooltip content
    const defaultTooltipContent = useMemo(() => {
      if (!isVisited) {
        return "Not visited yet";
      }

      const parts = ["Visited"];
      if (showCount && visitCount > 0) {
        parts.push(`${visitCount} time${visitCount === 1 ? "" : "s"}`);
      }
      if (lastVisit) {
        const date =
          typeof lastVisit === "number" ? new Date(lastVisit) : lastVisit;
        const timeAgo = formatTimeAgo(date);
        parts.push(timeAgo);
      }

      return parts.join(" ");
    }, [isVisited, visitCount, lastVisit, showCount, formatTimeAgo]);

    const tooltipText = tooltipContent || defaultTooltipContent;

    if (!isVisited && visitCount === 0) {
      return null;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={badgeClassName}
            role="status"
            aria-label={
              ariaLabel ||
              `${isVisited ? "Visited" : "Not visited"}${visitCount > 0 ? ` ${visitCount} times` : ""}`
            }
            aria-live="polite"
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  },
);

VisitedBadge.displayName = "VisitedBadge";

/**
 * VisitedBadgeGroup Component
 * Shows multiple visit badges for different time periods
 */
export interface VisitedBadgeGroupProps {
  /** Visit data for today */
  todayVisits?: number;
  /** Visit data for this week */
  weekVisits?: number;
  /** Visit data for this month */
  monthVisits?: number;
  /** Size of the badges */
  size?: "sm" | "md" | "lg";
  /** Custom className for the group */
  className?: string;
}

export const VisitedBadgeGroup = memo(
  ({
    todayVisits = 0,
    weekVisits = 0,
    monthVisits = 0,
    size = "sm",
    className,
  }: VisitedBadgeGroupProps) => {
    // Memoize badges array to prevent recreation on every render
    const badges = useMemo(() => {
      const badgeArray = [];

      if (todayVisits > 0) {
        badgeArray.push(
          <VisitedBadge
            key="today"
            isVisited={true}
            visitCount={todayVisits}
            size={size}
            className="bg-green-500"
            tooltipContent={`Visited today ${todayVisits} time${todayVisits === 1 ? "" : "s"}`}
            ariaLabel={`Visited today ${todayVisits} times`}
          />,
        );
      }

      if (weekVisits > todayVisits) {
        badgeArray.push(
          <VisitedBadge
            key="week"
            isVisited={true}
            visitCount={weekVisits - todayVisits}
            size={size}
            className="bg-blue-500"
            tooltipContent={`Visited this week ${weekVisits} times`}
            ariaLabel={`Visited this week ${weekVisits} times`}
          />,
        );
      }

      if (monthVisits > weekVisits) {
        badgeArray.push(
          <VisitedBadge
            key="month"
            isVisited={true}
            visitCount={monthVisits - weekVisits}
            size={size}
            className="bg-purple-500"
            tooltipContent={`Visited this month ${monthVisits} times`}
            ariaLabel={`Visited this month ${monthVisits} times`}
          />,
        );
      }

      return badgeArray;
    }, [todayVisits, weekVisits, monthVisits, size]);

    if (badges.length === 0) {
      return (
        <VisitedBadge
          isVisited={false}
          size={size}
          className={className}
          tooltipContent="Not visited yet"
          ariaLabel="Not visited"
        />
      );
    }

    return (
      <div className={cn("flex items-center gap-1", className)}>{badges}</div>
    );
  },
);

VisitedBadgeGroup.displayName = "VisitedBadgeGroup";
