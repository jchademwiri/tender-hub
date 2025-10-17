'use client';

/**
 * Visit Tracker Context Provider
 * Provides visit tracking state and functionality across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useVisitTracker, useVisitStats, useVisitedPages } from '@/hooks/use-visit-tracker';
import { VisitStats, DailyVisits } from '@/lib/visit-utils';
import { getCachedLocalStorage } from '@/lib/performance-utils';

interface VisitTrackerContextType {
  // Core tracking functions
  trackVisit: (url: string) => boolean;
  trackCurrentPage: () => boolean;

  // Data access
  stats: VisitStats;
  todayVisits: DailyVisits | null;
  visitedPages: string[];

  // Utility functions
  clearAllData: () => boolean;
  refreshStats: () => void;
  refreshVisitedPages: () => void;

  // State
  isTracking: boolean;
  lastTrackedUrl: string | null;
  error: string | null;

  // Settings
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const VisitTrackerContext = createContext<VisitTrackerContextType | undefined>(undefined);

/**
 * Props for VisitTrackerProvider
 */
interface VisitTrackerProviderProps {
  children: ReactNode;
  enabled?: boolean;
  autoTrack?: boolean;
}

/**
 * Provider component for visit tracking context
 */
export function VisitTrackerProvider({
  children,
  enabled = true,
  autoTrack = true
}: VisitTrackerProviderProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  // Use the visit tracking hook
  const {
    trackVisit,
    trackCurrentPage,
    clearAllData,
    isTracking,
    lastTrackedUrl,
    error,
  } = useVisitTracker();

  // Use the stats hook
  const stats = useVisitStats();

  // Use the visited pages hook
  const visitedPages = useVisitedPages();

  // Get today's visits (we'll implement this as a state)
  const [todayVisits, setTodayVisits] = useState<DailyVisits | null>(null);

  // State for forcing refresh of visited pages
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
    * Refresh today's visits data with caching
    */
   const refreshTodayVisits = useCallback(() => {
     try {
       // Use cached data first to improve performance
       const cachedVisits = getCachedLocalStorage('visit-tracker-visits', 10000) as any[]; // 10 second cache
       if (cachedVisits && Array.isArray(cachedVisits)) {
         const today = new Date().toISOString().split('T')[0];
         const todayVisitsData = cachedVisits.find((day: any) => day.date === today);
         if (todayVisitsData) {
           setTodayVisits(todayVisitsData);
           return;
         }
       }

       // Import the function dynamically to avoid SSR issues
       import('@/lib/visit-utils').then(({ getTodayVisits }) => {
         const visits = getTodayVisits();
         setTodayVisits(visits);
       });
     } catch (err) {
       console.warn('Failed to refresh today\'s visits:', err);
     }
   }, []);

  /**
    * Refresh visit statistics
    */
   const refreshStats = useCallback(() => {
     // The useVisitStats hook handles its own refresh
     // We can force a re-render by updating a dummy state if needed
     refreshTodayVisits();
   }, [refreshTodayVisits]);

   /**
    * Refresh visited pages by triggering a refresh of the underlying data
    */
   const refreshVisitedPages = useCallback(() => {
     // Force refresh by updating the refresh trigger
     // This will cause the useVisitedPages hook to refetch data
     setRefreshTrigger(prev => prev + 1);

     // Also refresh today's visits as they are related
     refreshTodayVisits();
   }, [refreshTodayVisits]);

  /**
   * Enhanced track visit function that respects enabled state
   */
  const contextTrackVisit = useCallback((url: string): boolean => {
    if (!isEnabled) {
      return false;
    }
    return trackVisit(url);
  }, [isEnabled, trackVisit]);

  /**
   * Enhanced track current page function that respects enabled state
   */
  const contextTrackCurrentPage = useCallback((): boolean => {
    if (!isEnabled) {
      return false;
    }
    return trackCurrentPage();
  }, [isEnabled, trackCurrentPage]);

  /**
   * Enhanced clear all data function that respects enabled state
   */
  const contextClearAllData = useCallback((): boolean => {
    if (!isEnabled) {
      return false;
    }
    const result = clearAllData();
    if (result) {
      // Clear local state as well
      setTodayVisits(null);
    }
    return result;
  }, [isEnabled, clearAllData]);

  /**
   * Initialize today's visits data
   */
  useEffect(() => {
    if (isEnabled) {
      refreshTodayVisits();
    }
  }, [isEnabled, refreshTodayVisits]);

  /**
   * Auto-tracking effect
   */
  useEffect(() => {
    if (autoTrack && isEnabled && typeof window !== 'undefined') {
      // Track initial page load
      contextTrackCurrentPage();

      // Set up periodic tracking for long page visits
      const interval = setInterval(() => {
        contextTrackCurrentPage();
      }, 30000); // Every 30 seconds

      return () => {
        clearInterval(interval);
      };
    }
  }, [autoTrack, isEnabled, contextTrackCurrentPage]);

  /**
   * Listen for browser navigation events
   */
  useEffect(() => {
    if (!autoTrack || !isEnabled || typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      contextTrackCurrentPage();
    };

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [autoTrack, isEnabled, contextTrackCurrentPage]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: VisitTrackerContextType = useMemo(() => ({
    // Core functions
    trackVisit: contextTrackVisit,
    trackCurrentPage: contextTrackCurrentPage,

    // Data
    stats,
    todayVisits,
    visitedPages,

    // Utility functions
    clearAllData: contextClearAllData,
    refreshStats,
    refreshVisitedPages,

    // State
    isTracking,
    lastTrackedUrl,
    error,

    // Settings
    isEnabled,
    setEnabled: setIsEnabled,
  }), [
    contextTrackVisit,
    contextTrackCurrentPage,
    stats,
    todayVisits,
    visitedPages,
    contextClearAllData,
    refreshStats,
    refreshVisitedPages,
    isTracking,
    lastTrackedUrl,
    error,
    isEnabled,
    setIsEnabled,
  ]);

  return (
    <VisitTrackerContext.Provider value={contextValue}>
      {children}
    </VisitTrackerContext.Provider>
  );
}

/**
 * Hook to use the visit tracker context
 * Must be used within a VisitTrackerProvider
 */
export function useVisitTrackerContext(): VisitTrackerContextType {
  const context = useContext(VisitTrackerContext);

  if (context === undefined) {
    throw new Error('useVisitTrackerContext must be used within a VisitTrackerProvider');
  }

  return context;
}

/**
 * Hook for accessing visit statistics from context
 */
export function useVisitStatsContext(): VisitStats {
  const { stats } = useVisitTrackerContext();
  return stats;
}

/**
 * Hook for accessing visited pages from context
 */
export function useVisitedPagesContext(): string[] {
  const { visitedPages } = useVisitTrackerContext();
  return visitedPages;
}

/**
 * Hook for accessing today's visits from context
 */
export function useTodayVisitsContext(): DailyVisits | null {
  const { todayVisits } = useVisitTrackerContext();
  return todayVisits;
}

/**
 * Hook for visit tracking actions from context
 */
export function useVisitTrackerActions() {
  const context = useVisitTrackerContext();

  return {
    trackVisit: context.trackVisit,
    trackCurrentPage: context.trackCurrentPage,
    clearAllData: context.clearAllData,
    refreshStats: context.refreshStats,
    refreshVisitedPages: context.refreshVisitedPages,
    isEnabled: context.isEnabled,
    setEnabled: context.setEnabled,
  };
}