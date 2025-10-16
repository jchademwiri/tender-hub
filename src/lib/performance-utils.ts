/**
 * Performance optimization utilities for React applications
 * Provides memoization helpers, performance monitoring, and optimization utilities
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Performance monitoring utilities
 */
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

/**
 * Hook to monitor component performance
 */
export function usePerformanceMonitor(componentName: string): PerformanceMetrics {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  });

  const startTime = performance.now();

  // Update metrics after render
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  metricsRef.current.renderCount++;
  metricsRef.current.lastRenderTime = renderTime;
  metricsRef.current.totalRenderTime += renderTime;
  metricsRef.current.averageRenderTime = metricsRef.current.totalRenderTime / metricsRef.current.renderCount;

  // Log slow renders in development
  if (process.env.NODE_ENV === 'development' && renderTime > 16) {
    console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
  }

  return metricsRef.current;
}

/**
 * Memoization utilities for localStorage operations
 */
const localStorageCache = new Map<string, { value: any; timestamp: number; ttl: number }>();

/**
 * Get cached value from localStorage with TTL support
 */
export function getCachedLocalStorage<T>(key: string, ttl: number = 5000): T | null {
  const cached = localStorageCache.get(key);

  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.value;
  }

  try {
    const item = localStorage.getItem(key);
    const value = item ? JSON.parse(item) : null;

    localStorageCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    return value;
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Set cached value to localStorage
 */
export function setCachedLocalStorage(key: string, value: any, ttl: number = 5000): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    localStorageCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    return true;
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, cached] of localStorageCache.entries()) {
    if ((now - cached.timestamp) >= cached.ttl) {
      localStorageCache.delete(key);
    }
  }
}

/**
 * Debounce utility for expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

/**
 * Throttle utility for frequent operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - (now - lastCallRef.current));
    }
  }, [callback, delay]);
}

/**
 * Memoized callback that prevents unnecessary re-renders
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Memoized value that prevents unnecessary recalculations
 */
export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Stable reference for objects that should not trigger re-renders
 */
export function useStableValue<T extends Record<string, any>>(value: T): T {
  const ref = useRef<T>(value);

  // Update ref if value has actually changed
  const hasChanged = Object.keys(value).some(key => ref.current[key] !== value[key]);
  if (hasChanged) {
    ref.current = value;
  }

  return ref.current;
}

/**
 * Performance-optimized event handler creator
 */
export function createOptimizedHandler<T extends Event = Event>(
  handler: (event: T) => void,
  options?: {
    debounce?: number;
    throttle?: number;
    preventDefault?: boolean;
    stopPropagation?: boolean;
  }
) {
  const { debounce, throttle, preventDefault = false, stopPropagation = false } = options || {};

  let optimizedHandler = (event: T) => {
    if (preventDefault) event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    handler(event);
  };

  if (debounce) {
    const debouncedFn = useDebounce(optimizedHandler, debounce);
    return debouncedFn;
  }

  if (throttle) {
    const throttledFn = useThrottle(optimizedHandler, throttle);
    return throttledFn;
  }

  return optimizedHandler;
}

/**
 * Batch multiple state updates to prevent cascading re-renders
 */
export function useBatchedState<T>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState(initialValue);
  const pendingUpdatesRef = useRef<Array<(prev: T) => T>>([]);

  const batchedSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      pendingUpdatesRef.current.push(value as (prev: T) => T);
    } else {
      // Clear pending updates and set final value
      pendingUpdatesRef.current = [];
      setState(value);
    }
  }, []);

  const flushUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length > 0) {
      setState(prev => {
        return pendingUpdatesRef.current.reduce((acc, update) => update(acc), prev);
      });
      pendingUpdatesRef.current = [];
    }
  }, []);

  return [state, batchedSetState, flushUpdates];
}

/**
 * Cleanup function for performance monitoring
 */
export function cleanupPerformanceUtils(): void {
  clearExpiredCache();
  localStorageCache.clear();
}