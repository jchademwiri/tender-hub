'use client';

/**
 * Visit tracking hook for React components
 * Provides functions to track page visits and get visit data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  addVisit,
  getVisitStats,
  getVisitedPagesForSession,
  getTodayVisits,
  clearAllVisitData,
  type VisitStats,
  type DailyVisits,
} from '@/lib/visit-utils';
import { getCachedLocalStorage } from '@/lib/performance-utils';

export interface UseVisitTrackerReturn {
  // Tracking functions
  trackVisit: (url: string) => boolean;
  trackCurrentPage: () => boolean;

  // Data getters
  getStats: () => VisitStats;
  getTodayVisits: () => DailyVisits | null;
  getVisitedPages: () => string[];

  // Utility functions
  clearAllData: () => boolean;

  // State
  isTracking: boolean;
  lastTrackedUrl: string | null;
  error: string | null;
}

/**
 * Hook for visit tracking functionality
 */
export function useVisitTracker(): UseVisitTrackerReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [lastTrackedUrl, setLastTrackedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Track a visit to a specific URL
   */
  const trackVisit = useCallback((url: string): boolean => {
    try {
      // Validate URL
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
      }

      // Normalize URL (remove query params and fragments for consistency)
      const normalizedUrl = url.split('?')[0].split('#')[0];

      const success = addVisit(normalizedUrl);

      if (success) {
        // Update state to reflect tracking
        setIsTracking(true);
        setLastTrackedUrl(normalizedUrl);
        setError(null);

        // Set tracking to false after a brief delay to show user feedback
        setTimeout(() => {
          setIsTracking(false);
        }, 100);
      } else {
        throw new Error('Failed to track visit');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsTracking(false);
      console.warn('Visit tracking error:', err);
      return false;
    }
  }, []);

  /**
   * Track the current page URL
   */
  const trackCurrentPage = useCallback((): boolean => {
    if (typeof window === 'undefined') {
      return false; // SSR guard
    }

    return trackVisit(window.location.pathname);
  }, [trackVisit]);

  /**
   * Get visit statistics
   */
  const getStats = useCallback((): VisitStats => {
    try {
      return getVisitStats();
    } catch (err) {
      console.warn('Failed to get visit stats:', err);
      return {
        totalVisits: 0,
        uniquePages: 0,
        averageVisitsPerPage: 0,
        mostVisitedPage: '',
        visitCountByPage: {},
      };
    }
  }, []);

  /**
   * Get today's visits
   */
  const getTodayVisitsData = useCallback((): DailyVisits | null => {
    try {
      return getTodayVisits();
    } catch (err) {
      console.warn('Failed to get today\'s visits:', err);
      return null;
    }
  }, []);

  /**
   * Get visited pages for current session
   */
  const getVisitedPages = useCallback((): string[] => {
    try {
      return getVisitedPagesForSession();
    } catch (err) {
      console.warn('Failed to get visited pages:', err);
      return [];
    }
  }, []);

  /**
   * Clear all visit data
   */
  const clearAllData = useCallback((): boolean => {
    try {
      setLastTrackedUrl(null);
      setError(null);
      return clearAllVisitData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      console.warn('Failed to clear visit data:', err);
      return false;
    }
  }, []);

  /**
   * Auto-track page visits when URL changes
   * This effect runs when the component mounts and when the URL changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // SSR guard
    }

    // Track initial page load
    trackCurrentPage();

    // Set up periodic tracking (every 30 seconds) to catch long page visits
    const interval = setInterval(() => {
      trackCurrentPage();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [trackCurrentPage]);

  /**
   * Listen for browser navigation events (popstate only)
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // SSR guard
    }

    const handlePopState = () => {
      trackCurrentPage();
    };

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [trackCurrentPage]);

  return {
    // Functions
    trackVisit,
    trackCurrentPage,
    getStats,
    getTodayVisits: getTodayVisitsData,
    getVisitedPages,
    clearAllData,

    // State
    isTracking,
    lastTrackedUrl,
    error,
  };
}

/**
 * Hook for getting visit statistics only (lighter version)
 */
export function useVisitStats(): VisitStats {
  const [stats, setStats] = useState<VisitStats>({
    totalVisits: 0,
    uniquePages: 0,
    averageVisitsPerPage: 0,
    mostVisitedPage: '',
    visitCountByPage: {},
  });

  // Memoized refresh function with caching
  const refreshStats = useCallback(() => {
    try {
      // Use cached localStorage to reduce expensive operations
      const cachedVisits = getCachedLocalStorage('visit-tracker-visits', 30000); // 30 second cache

      if (cachedVisits) {
        // Use cached data if available
        const newStats = getVisitStats();
        setStats(newStats);
      } else {
        // Only recalculate if cache is missing/stale
        const newStats = getVisitStats();
        setStats(newStats);
      }
    } catch (err) {
      console.warn('Failed to refresh visit stats:', err);
    }
  }, []);

  useEffect(() => {
    refreshStats();

    // Refresh stats less frequently to reduce performance impact
    const interval = setInterval(refreshStats, 120000); // Every 2 minutes instead of 1

    return () => {
      clearInterval(interval);
    };
  }, [refreshStats]);

  return stats;
}

/**
 * Hook for getting visited pages in current session
 */
export function useVisitedPages(): string[] {
  const [visitedPages, setVisitedPages] = useState<string[]>([]);

  // Memoized refresh function with caching
  const refreshVisitedPages = useCallback(() => {
    try {
      // Use cached session ID to avoid unnecessary recalculations
      const sessionId = getCachedLocalStorage('visit-tracker-session-id', 60000); // 1 minute cache
      if (sessionId) {
        const pages = getVisitedPagesForSession();
        setVisitedPages(pages);
      }
    } catch (err) {
      console.warn('Failed to refresh visited pages:', err);
    }
  }, []);

  useEffect(() => {
    refreshVisitedPages();

    // Throttle storage change events to prevent excessive updates
    let timeoutId: number | undefined;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('visit-tracker')) {
        // Debounce storage events to prevent excessive refreshes
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(refreshVisitedPages, 100);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };
  }, [refreshVisitedPages]);

  return visitedPages;
}