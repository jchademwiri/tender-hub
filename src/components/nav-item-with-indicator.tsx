"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { VisitedBadge } from "@/components/ui/visited-badge";
import { useVisitTrackerContext } from "@/contexts/visit-tracker-context";
import { cn } from "@/lib/utils";

interface NavItemWithIndicatorProps {
  /** The href for the navigation link */
  href: string;
  /** The display text for the navigation item */
  children: React.ReactNode;
  /** Whether this is the current active page */
  isActive?: boolean;
  /** Custom className for the navigation item */
  className?: string;
  /** Whether to show visit indicators */
  showIndicator?: boolean;
  /** Custom click handler */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Whether the item should be disabled */
  disabled?: boolean;
  /** Icon to display before the text */
  icon?: React.ReactNode;
  /** Badge configuration */
  badgeClassName?: string;
  /** Size of the visit badge */
  badgeSize?: "sm" | "md" | "lg";
}

/**
 * Navigation Item Component with Visit Indicators
 * Reusable component for navigation items with visit tracking indicators
 */
export function NavItemWithIndicator({
  href,
  children,
  isActive,
  className,
  showIndicator = true,
  onClick,
  ariaLabel,
  disabled = false,
  icon,
  badgeClassName,
  badgeSize = "sm",
}: NavItemWithIndicatorProps) {
  const pathname = usePathname();
  const { todayVisits, visitedPages } = useVisitTrackerContext();

  // Determine if this page is currently active
  const currentPath = pathname || "";
  const isCurrentPage = isActive ?? currentPath === href;

  // Get visit data for this page
  const todayData =
    todayVisits?.visits.filter((visit) => visit.url === href) || [];
  const hasBeenVisited = visitedPages.includes(href) || todayData.length > 0;
  const visitCount = todayData.length;

  // Get the most recent visit timestamp
  const lastVisit =
    todayData.length > 0
      ? new Date(Math.max(...todayData.map((v) => v.timestamp)))
      : null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const linkClassName = cn(
    // Base styles
    "relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
    // Focus styles
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
    // Active/current page styles
    isCurrentPage && ["bg-primary text-primary-foreground", "shadow-sm"],
    // Hover styles
    !isCurrentPage &&
      !disabled && ["text-foreground hover:text-primary hover:bg-accent/50"],
    // Disabled styles
    disabled && ["text-muted-foreground cursor-not-allowed opacity-50"],
    // Custom className
    className,
  );

  return (
    <div className="relative flex items-center">
      <Link
        href={disabled ? "#" : href}
        className={linkClassName}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-current={isCurrentPage ? "page" : undefined}
        aria-disabled={disabled}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </Link>

      {/* Visit Indicator */}
      {showIndicator && (
        <div className="absolute -top-1 -right-1">
          <VisitedBadge
            isVisited={hasBeenVisited}
            visitCount={visitCount}
            lastVisit={lastVisit}
            size={badgeSize}
            className={badgeClassName}
            ariaLabel={`${hasBeenVisited ? "Visited" : "Not visited"}${visitCount > 0 ? ` ${visitCount} times` : ""}`}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Mobile Navigation Item Component
 * Optimized for mobile devices with touch-friendly interactions
 */
export function MobileNavItemWithIndicator({
  href,
  children,
  isActive,
  className,
  showIndicator = true,
  onClick,
  ariaLabel,
  disabled = false,
  icon,
  badgeClassName,
  badgeSize = "md",
}: NavItemWithIndicatorProps) {
  return (
    <NavItemWithIndicator
      href={href}
      isActive={isActive}
      className={cn(
        // Mobile-optimized styles
        "w-full justify-start text-base",
        "min-h-[44px]", // Touch target size
        "active:bg-accent/70", // Touch feedback
        className,
      )}
      showIndicator={showIndicator}
      onClick={onClick}
      ariaLabel={ariaLabel}
      disabled={disabled}
      icon={icon}
      badgeClassName={cn(
        "scale-110", // Slightly larger on mobile
        badgeClassName,
      )}
      badgeSize={badgeSize}
    >
      {children}
    </NavItemWithIndicator>
  );
}

/**
 * Compact Navigation Item Component
 * Smaller version for space-constrained layouts
 */
export function CompactNavItemWithIndicator({
  href,
  children,
  isActive,
  className,
  showIndicator = true,
  onClick,
  ariaLabel,
  disabled = false,
  icon,
  badgeClassName,
  badgeSize = "sm",
}: NavItemWithIndicatorProps) {
  return (
    <NavItemWithIndicator
      href={href}
      isActive={isActive}
      className={cn(
        // Compact styles
        "px-2 py-1 text-xs",
        "gap-1",
        className,
      )}
      showIndicator={showIndicator}
      onClick={onClick}
      ariaLabel={ariaLabel}
      disabled={disabled}
      icon={icon}
      badgeClassName={cn(
        "scale-75", // Smaller badge for compact layout
        badgeClassName,
      )}
      badgeSize={badgeSize}
    >
      {children}
    </NavItemWithIndicator>
  );
}
