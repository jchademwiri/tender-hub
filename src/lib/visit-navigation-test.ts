/**
 * Test utilities for visit tracking navigation
 * Provides functions to test the integration between navigation and visit tracking
 */

import { getTodayVisits, getVisitStats, clearAllVisitData } from './visit-utils';

/**
 * Test function to verify navigation visit tracking is working
 */
export function testNavigationVisitTracking(): {
  success: boolean;
  results: Record<string, any>;
  errors: string[];
} {
  const errors: string[] = [];
  const results: Record<string, any> = {};

  try {
    // Clear existing data for clean test
    clearAllVisitData();
    results.cleared = true;

    // Test navigation paths
    const testPaths = ['/dashboard', '/publishers', '/profile'];

    // Simulate visits to each path
    testPaths.forEach((path, index) => {
      const success = require('./visit-utils').addVisit(path);
      results[`visit_${index}`] = { path, success };

      if (!success) {
        errors.push(`Failed to track visit to ${path}`);
      }
    });

    // Get today's visits
    const todayVisits = getTodayVisits();
    results.todayVisits = todayVisits;

    if (!todayVisits || todayVisits.visits.length !== testPaths.length) {
      errors.push(`Expected ${testPaths.length} visits, got ${todayVisits?.visits.length || 0}`);
    }

    // Get visit stats
    const stats = getVisitStats();
    results.stats = stats;

    if (stats.totalVisits !== testPaths.length) {
      errors.push(`Expected ${testPaths.length} total visits, got ${stats.totalVisits}`);
    }

    // Check if all paths are in visit count
    const expectedVisitCount = testPaths.reduce((acc, path) => {
      acc[path] = 1;
      return acc;
    }, {} as Record<string, number>);

    const actualVisitCount: Record<string, number> = {};
    todayVisits?.visits.forEach(visit => {
      actualVisitCount[visit.url] = (actualVisitCount[visit.url] || 0) + 1;
    });

    results.visitCountComparison = {
      expected: expectedVisitCount,
      actual: actualVisitCount
    };

    const countMatches = Object.keys(expectedVisitCount).every(
      path => expectedVisitCount[path] === actualVisitCount[path]
    );

    if (!countMatches) {
      errors.push('Visit counts do not match expected results');
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };

  } catch (error) {
    errors.push(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      results,
      errors
    };
  }
}

/**
 * Integration test for navigation components
 */
export function testNavigationIntegration(): {
  success: boolean;
  message: string;
  details: string[];
} {
  const details: string[] = [];

  try {
    // Test if components can be imported
    const { VisitedBadge } = require('../components/ui/visited-badge');
    const { NavItemWithIndicator } = require('../components/nav-item-with-indicator');

    details.push('✓ Components imported successfully');

    // Test if visit tracking context is available
    const { useVisitTrackerContext } = require('../contexts/visit-tracker-context');
    details.push('✓ Visit tracker context available');

    // Test if visit utils are working
    const { getTodayVisits, addVisit } = require('./visit-utils');

    const testVisit = addVisit('/test-path');
    if (testVisit) {
      details.push('✓ Visit tracking functions working');
    } else {
      details.push('✗ Visit tracking functions failed');
    }

    const todayVisits = getTodayVisits();
    if (todayVisits) {
      details.push('✓ Today visits data accessible');
    } else {
      details.push('✗ Today visits data not accessible');
    }

    const success = details.every(detail => detail.startsWith('✓'));

    return {
      success,
      message: success ? 'Navigation integration test passed' : 'Navigation integration test failed',
      details
    };

  } catch (error) {
    return {
      success: false,
      message: `Integration test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: [`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Performance test for navigation with visit indicators
 */
export function testNavigationPerformance(iterations: number = 100): {
  averageRenderTime: number;
  memoryUsage: number;
  success: boolean;
} {
  const startTime = performance.now();
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    // Simulate multiple navigation renders
    for (let i = 0; i < iterations; i++) {
      const { VisitedBadge } = require('../components/ui/visited-badge');
      const { NavItemWithIndicator } = require('../components/nav-item-with-indicator');

      // Test component creation (simulated)
      const badgeProps = {
        isVisited: i % 2 === 0,
        visitCount: Math.floor(i / 10),
        lastVisit: i % 3 === 0 ? new Date() : null
      };

      const navProps = {
        href: `/test-${i}`,
        children: `Test Item ${i}`,
        showIndicator: true
      };

      // Simulate props validation
      if (!badgeProps.isVisited && badgeProps.visitCount > 0) {
        throw new Error('Invalid badge props');
      }
    }

    const endTime = performance.now();
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const averageRenderTime = (endTime - startTime) / iterations;
    const memoryUsage = finalMemory - initialMemory;

    return {
      averageRenderTime,
      memoryUsage,
      success: true
    };

  } catch (error) {
    return {
      averageRenderTime: 0,
      memoryUsage: 0,
      success: false
    };
  }
}