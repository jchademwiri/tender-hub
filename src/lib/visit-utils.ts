/**
 * Visit tracking utility functions
 * Handles localStorage operations with error handling and data validation
 */

import { getCachedLocalStorage, setCachedLocalStorage } from './performance-utils';

export interface VisitData {
  url: string;
  timestamp: number;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    screen: {
      width: number;
      height: number;
    };
    viewport: {
      width: number;
      height: number;
    };
  };
}

export interface DailyVisits {
  date: string; // YYYY-MM-DD format
  visits: VisitData[];
  totalCount: number;
}

export interface VisitStats {
  totalVisits: number;
  uniquePages: number;
  averageVisitsPerPage: number;
  mostVisitedPage: string;
  visitCountByPage: Record<string, number>;
}

/**
 * Storage keys for localStorage
 */
const STORAGE_KEYS = {
  VISITS: 'visit-tracker-visits',
  SESSION_ID: 'visit-tracker-session-id',
  LAST_RESET: 'visit-tracker-last-reset',
} as const;

/**
 * Generate a unique session ID for the current browsing session
 */
export function generateSessionId(): string {
  const existingSessionId = getFromStorage<string>(STORAGE_KEYS.SESSION_ID);
  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  saveToStorage(STORAGE_KEYS.SESSION_ID, sessionId);
  return sessionId;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if we need to reset daily data (new day)
 */
export function shouldResetDailyData(): boolean {
  const lastReset = getFromStorage(STORAGE_KEYS.LAST_RESET);
  const currentDate = getCurrentDate();

  return !lastReset || lastReset !== currentDate;
}

/**
 * Reset the last reset date to current date
 */
export function markDailyReset(): void {
  saveToStorage(STORAGE_KEYS.LAST_RESET, getCurrentDate());
}

/**
 * Save data to localStorage with error handling
 */
export function saveToStorage(key: string, data: any): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Get data from localStorage with error handling
 */
export function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
    return false;
  }
}

/**
 * Get all visits from storage with caching
 */
export function getAllVisits(): DailyVisits[] {
  // Use cached localStorage to improve performance for frequent reads
  return getCachedLocalStorage<DailyVisits[]>(STORAGE_KEYS.VISITS, 5000) || [];
}

/**
 * Save visits to storage
 */
export function saveVisits(visits: DailyVisits[]): boolean {
  return saveToStorage(STORAGE_KEYS.VISITS, visits);
}

/**
 * Get visits for current day
 */
export function getTodayVisits(): DailyVisits | null {
  const allVisits = getAllVisits();
  const currentDate = getCurrentDate();

  return allVisits.find(day => day.date === currentDate) || null;
}

/**
 * Add a new visit to today's data
 */
export function addVisit(url: string): boolean {
  try {
    // Reset daily data if needed
    if (shouldResetDailyData()) {
      clearOldVisits();
      markDailyReset();
    }

    const allVisits = getAllVisits();
    const currentDate = getCurrentDate();
    const sessionId = generateSessionId();

    // Get or create today's visit data
    let todayVisits = allVisits.find(day => day.date === currentDate);
    if (!todayVisits) {
      todayVisits = {
        date: currentDate,
        visits: [],
        totalCount: 0,
      };
      allVisits.push(todayVisits);
    }

    // Check if this URL was visited in the current session
    const lastVisit = todayVisits.visits
      .filter(v => v.sessionId === sessionId)
      .pop();

    // Only add if it's a different URL or more than 30 seconds since last visit
    if (!lastVisit ||
        lastVisit.url !== url ||
        (Date.now() - lastVisit.timestamp) > 30000) {

      const visitData: VisitData = {
        url,
        timestamp: Date.now(),
        sessionId,
        deviceInfo: {
          userAgent: navigator.userAgent,
          screen: {
            width: screen.width,
            height: screen.height,
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      todayVisits.visits.push(visitData);
      todayVisits.totalCount++;

      return saveVisits(allVisits);
    }

    return true; // No new visit added, but not an error
  } catch (error) {
    console.warn('Failed to add visit:', error);
    return false;
  }
}

/**
 * Clear old visits (keep only last 30 days)
 */
export function clearOldVisits(): void {
  try {
    const allVisits = getAllVisits();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredVisits = allVisits.filter(day => {
      const visitDate = new Date(day.date);
      return visitDate >= thirtyDaysAgo;
    });

    saveVisits(filteredVisits);
  } catch (error) {
    console.warn('Failed to clear old visits:', error);
  }
}

/**
 * Get visit statistics with caching to improve performance
 */
export function getVisitStats(): VisitStats {
  // Use cached data to avoid expensive recalculations
  const cacheKey = 'visit-stats-cache';
  const cachedStats = getCachedLocalStorage<VisitStats>(cacheKey, 30000); // 30 second cache

  if (cachedStats) {
    return cachedStats;
  }

  const allVisits = getAllVisits();

  const totalVisits = allVisits.reduce((sum, day) => sum + day.totalCount, 0);
  const visitCountByPage: Record<string, number> = {};
  let mostVisitedPage = '';
  let maxCount = 0;

  allVisits.forEach(day => {
    day.visits.forEach(visit => {
      const url = visit.url;
      visitCountByPage[url] = (visitCountByPage[url] || 0) + 1;

      if (visitCountByPage[url] > maxCount) {
        maxCount = visitCountByPage[url];
        mostVisitedPage = url;
      }
    });
  });

  const uniquePages = Object.keys(visitCountByPage).length;
  const averageVisitsPerPage = uniquePages > 0 ? totalVisits / uniquePages : 0;

  const stats: VisitStats = {
    totalVisits,
    uniquePages,
    averageVisitsPerPage: Math.round(averageVisitsPerPage * 100) / 100,
    mostVisitedPage,
    visitCountByPage,
  };

  // Cache the calculated stats
  setCachedLocalStorage(cacheKey, stats, 30000);

  return stats;
}

/**
 * Get visited pages for current session
 */
export function getVisitedPagesForSession(): string[] {
  const sessionId = getFromStorage<string>(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) return [];

  const allVisits = getAllVisits();
  const visitedUrls = new Set<string>();

  allVisits.forEach(day => {
    day.visits
      .filter(visit => visit.sessionId === sessionId)
      .forEach(visit => visitedUrls.add(visit.url));
  });

  return Array.from(visitedUrls);
}

/**
 * Clear all visit data (for privacy/reset purposes)
 */
export function clearAllVisitData(): boolean {
  try {
    removeFromStorage(STORAGE_KEYS.VISITS);
    removeFromStorage(STORAGE_KEYS.SESSION_ID);
    removeFromStorage(STORAGE_KEYS.LAST_RESET);
    return true;
  } catch (error) {
    console.warn('Failed to clear visit data:', error);
    return false;
  }
}