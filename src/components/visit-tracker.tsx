'use client';

/**
 * Visit Tracker Component
 * Client-side component that tracks page visits automatically
 * Integrates with Next.js router for seamless tracking
 */

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useVisitTrackerContext } from '@/contexts/visit-tracker-context';

interface VisitTrackerProps {
  /** Whether to track the current page immediately on mount */
  trackOnMount?: boolean;
  /** Whether to track page visibility changes (when user switches tabs) */
  trackVisibility?: boolean;
  /** Whether to track beforeunload events (when user leaves the page) */
  trackUnload?: boolean;
  /** Custom tracking function for special cases */
  onTrack?: (url: string) => void;
  /** Whether the component is enabled */
  enabled?: boolean;
}

/**
 * Visit Tracker Component
 * Automatically tracks page visits and integrates with Next.js router
 */
export function VisitTracker({
  trackOnMount = true,
  trackVisibility = true,
  trackUnload = true,
  onTrack,
  enabled = true,
}: VisitTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackCurrentPage, isEnabled } = useVisitTrackerContext();

  // Track if we've already tracked this page to avoid duplicate tracking
  const hasTrackedRef = useRef(false);
  // Track the last URL we processed to avoid duplicate tracking
  const lastUrlRef = useRef<string>('');

  /**
   * Generate the current full URL for tracking
   */
  const getCurrentUrl = (): string => {
    if (typeof window === 'undefined') {
      return pathname || '';
    }

    const url = new URL(window.location.href);
    url.pathname = pathname || '';

    // Include search params if they exist
    if (searchParams?.toString()) {
      url.search = searchParams.toString();
    }

    return url.pathname + url.search;
  };

  /**
   * Track the current page visit
   */
  const performTracking = (url: string) => {
    if (!enabled || !isEnabled) {
      return;
    }

    try {
      // Call custom tracking function if provided
      if (onTrack) {
        onTrack(url);
      } else {
        // Use context tracking
        trackCurrentPage();
      }

      hasTrackedRef.current = true;
      lastUrlRef.current = url;
    } catch (error) {
      console.warn('Visit tracking failed:', error);
    }
  };

  /**
   * Handle page visibility changes
   */
  useEffect(() => {
    if (!trackVisibility || !enabled || !isEnabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, track the visit
        const url = getCurrentUrl();
        if (url && url !== lastUrlRef.current) {
          performTracking(url);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackVisibility, enabled, isEnabled, getCurrentUrl]);

  /**
   * Handle beforeunload events
   */
  useEffect(() => {
    if (!trackUnload || !enabled || !isEnabled) {
      return;
    }

    const handleBeforeUnload = () => {
      const url = getCurrentUrl();
      if (url) {
        performTracking(url);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackUnload, enabled, isEnabled, getCurrentUrl]);

  /**
   * Track page changes based on pathname
   */
  useEffect(() => {
    if (!enabled || !isEnabled) {
      return;
    }

    const url = getCurrentUrl();

    // Don't track if it's the same URL we just tracked
    if (url === lastUrlRef.current && hasTrackedRef.current) {
      return;
    }

    // Track immediately if requested
    if (trackOnMount) {
      performTracking(url);
    } else {
      // Reset tracking flag for new page
      hasTrackedRef.current = false;
      lastUrlRef.current = url;
    }
  }, [pathname, searchParams, enabled, isEnabled, trackOnMount, getCurrentUrl]);

  /**
   * Track when search parameters change (for dynamic pages)
   */
  useEffect(() => {
    if (!enabled || !isEnabled || !searchParams) {
      return;
    }

    const url = getCurrentUrl();

    // Only track if search params actually changed and we haven't tracked this combination
    if (url !== lastUrlRef.current) {
      performTracking(url);
    }
  }, [searchParams, enabled, isEnabled, getCurrentUrl]);

  // This component doesn't render anything
  return null;
}

/**
 * Higher-order component for adding visit tracking to any component
 */
export function withVisitTracker<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<VisitTrackerProps, 'enabled'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <>
        <VisitTracker {...options} />
        <Component {...props} />
      </>
    );
  };

  WrappedComponent.displayName = `withVisitTracker(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manual visit tracking in components
 */
export function usePageTracking(options?: {
  trackOnMount?: boolean;
  trackVisibility?: boolean;
  onTrack?: (url: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackCurrentPage, isEnabled } = useVisitTrackerContext();

  const getCurrentUrl = (): string => {
    if (typeof window === 'undefined') {
      return pathname || '';
    }

    const url = new URL(window.location.href);
    url.pathname = pathname || '';

    if (searchParams?.toString()) {
      url.search = searchParams.toString();
    }

    return url.pathname + url.search;
  };

  const trackPage = () => {
    if (!isEnabled) {
      return false;
    }

    const url = getCurrentUrl();
    if (options?.onTrack) {
      options.onTrack(url);
    } else {
      trackCurrentPage();
    }
    return true;
  };

  useEffect(() => {
    if (options?.trackOnMount !== false) {
      trackPage();
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!options?.trackVisibility || !isEnabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackPage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [options?.trackVisibility, isEnabled]);

  return {
    trackPage,
    getCurrentUrl,
    isEnabled,
  };
}

/**
 * Visit Tracker with Suspense Boundary
 * Wrapper component that provides Suspense boundary for useSearchParams
 */
export function VisitTrackerWithSuspense(props: VisitTrackerProps) {
  return (
    <Suspense fallback={null}>
      <VisitTracker {...props} />
    </Suspense>
  );
}