# useEffect Usage Analysis and Optimization Guide

This document provides a comprehensive analysis of all `useEffect` usages in the Tender Hub application, documenting their purposes, potential issues, and recommendations for optimization using Next.js features.

## Overview

The application contains 34 instances of `useEffect` across 15 files. While `useEffect` is necessary for certain client-side operations, many instances can be optimized using Next.js server components, API routes, and other patterns to reduce client-side JavaScript and improve performance.

## Analysis by File

### 1. `src/contexts/visit-tracker-context.tsx`

#### useEffect #1 (Lines 188-192)
```typescript
useEffect(() => {
  if (isEnabled) {
    refreshTodayVisits();
  }
}, [isEnabled, refreshTodayVisits]);
```
**Purpose**: Initialize today's visits data when tracking is enabled.

**Potential Issues**:
- Dependency on `refreshTodayVisits` could cause infinite loops if not properly memoized
- Runs on every render if dependencies change

**Optimization**:
```typescript
// Convert to server component or use SWR for data fetching
// Example with SWR:
import useSWR from 'swr';

function VisitTrackerProvider({ children, enabled = true }) {
  const { data: todayVisits } = useSWR(
    enabled ? '/api/visits/today' : null,
    fetcher
  );
  // ... rest of component
}
```

#### useEffect #2 (Lines 197-211)
```typescript
useEffect(() => {
  if (autoTrack && isEnabled && typeof window !== "undefined") {
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
```
**Purpose**: Auto-tracking with periodic updates for long page visits.

**Potential Issues**:
- Memory leaks if cleanup not handled properly
- Excessive API calls every 30 seconds
- Dependency on `contextTrackCurrentPage` could cause re-initialization

**Optimization**:
```typescript
// Use Web APIs directly or move to a custom hook
// Consider using Intersection Observer or Page Visibility API
// Example:
useEffect(() => {
  if (!autoTrack || !isEnabled) return;

  const trackPage = () => {
    // Direct API call instead of context method
    navigator.sendBeacon('/api/track', JSON.stringify({
      url: window.location.href,
      timestamp: Date.now()
    }));
  };

  // Track initial load
  trackPage();

  // Use Page Visibility API for more efficient tracking
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      trackPage();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [autoTrack, isEnabled]);
```

#### useEffect #3 (Lines 216-231)
```typescript
useEffect(() => {
  if (!autoTrack || !isEnabled || typeof window === "undefined") {
    return;
  }

  const handlePopState = () => {
    contextTrackCurrentPage();
  };

  // Listen for browser back/forward navigation
  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, [autoTrack, isEnabled, contextTrackCurrentPage]);
```
**Purpose**: Handle browser navigation events (back/forward buttons).

**Potential Issues**:
- Multiple event listeners if dependencies change
- Could conflict with Next.js router events

**Optimization**:
```typescript
// Use Next.js router events instead
import { useRouter } from 'next/navigation';

function VisitTracker() {
  const router = useRouter();

  useEffect(() => {
    if (!autoTrack || !isEnabled) return;

    const handleRouteChange = (url) => {
      // Track route changes
      trackVisit(url);
    };

    router.events?.on('routeChangeComplete', handleRouteChange);
    return () => router.events?.off('routeChangeComplete', handleRouteChange);
  }, [autoTrack, isEnabled, router]);
}
```

### 2. `src/components/dashboard-nav.tsx`

#### useEffect #1 (Lines 29-40)
```typescript
useEffect(() => {
  // In a real app, you might fetch user data from an API or context
  // For now, we'll rely on the user being set by a parent component or server component
  const initializeUser = () => {
    // This is a placeholder - in a real implementation, you might:
    // 1. Get user from a global state management solution
    // 2. Fetch from localStorage if stored there
    // 3. Get from a context provider
  };

  initializeUser();
}, []);
```
**Purpose**: Initialize user data on component mount.

**Potential Issues**:
- Empty effect that doesn't actually do anything
- Placeholder code that should be implemented

**Optimization**:
```typescript
// Use Next.js server component for initial data
// app/dashboard/layout.tsx
export default async function DashboardLayout() {
  const user = await getUserFromSession();

  return (
    <UserProvider user={user}>
      <DashboardNav />
    </UserProvider>
  );
}

// Or use SWR for client-side fetching
import useSWR from 'swr';

function DashboardNav() {
  const { data: user } = useSWR('/api/user', fetcher);
  // ... rest of component
}
```

### 3. `src/app/(roles)/admin/invitations/page.tsx`

#### useEffect #1 (Lines 164-166)
```typescript
useEffect(() => {
  fetchInvitations();
}, [fetchInvitations]);
```
**Purpose**: Initial data loading for invitations.

**Potential Issues**:
- Could cause infinite loops if `fetchInvitations` is not memoized
- No cleanup for potential race conditions

**Optimization**:
```typescript
// Convert to server component
export default async function AdminInvitationsPage() {
  const invitations = await fetchInvitations();

  return (
    <InvitationTable invitations={invitations} />
  );
}

// Or use SWR for client-side fetching with better caching
import useSWR from 'swr';

function AdminInvitationsPage() {
  const { data: invitations, error, isLoading } = useSWR(
    '/api/admin/invitations',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading invitations</div>;

  return <InvitationTable invitations={invitations} />;
}
```

### 4. `src/app/(roles)/admin/team/page.tsx`

#### useEffect #1 (Lines 70-72)
```typescript
useEffect(() => {
  fetchMembers();
}, []);
```
**Purpose**: Load team members on component mount.

**Potential Issues**:
- No error handling in the effect
- No loading states managed
- Could be replaced with server-side data fetching

**Optimization**:
```typescript
// Use Next.js server component
export default async function AdminTeamManagement() {
  const members = await fetch('/api/team').then(res => res.json());

  return (
    <TeamMemberTable members={members} />
  );
}

// Or use React Query/SWR for better caching and error handling
import { useQuery } from '@tanstack/react-query';

function AdminTeamManagement() {
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => fetch('/api/team').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading team members...</div>;
  if (error) return <div>Error loading team members</div>;

  return <TeamMemberTable members={members} />;
}
```

### 5. `src/app/(roles)/manager/team/page.tsx`

#### useEffect #1 (Lines 71-73)
```typescript
useEffect(() => {
  fetchMembers();
}, []);
```
**Purpose**: Load team members for manager view.

**Potential Issues**:
- Similar issues as admin team page
- Manager-specific filtering logic in client

**Optimization**:
```typescript
// Server component with role-based filtering
export default async function ManagerTeamManagement() {
  const allMembers = await fetch('/api/team').then(res => res.json());
  const members = allMembers.filter(member => member.role === 'user');

  return (
    <TeamMemberTable members={members} />
  );
}
```

### 6. `src/app/(roles)/admin/invitations/components/bulk-progress-dialog.tsx`

#### useEffect #1 (Lines 58-62)
```typescript
useEffect(() => {
  if (isComplete && hasErrors) {
    setShowErrors(true);
  }
}, [isComplete, hasErrors]);
```
**Purpose**: Auto-show error details when bulk operation completes with errors.

**Potential Issues**:
- Simple effect, but could be handled in render logic
- No issues with this particular use case

**Optimization**:
```typescript
// This effect is actually fine, but could be simplified
// The logic could be moved to a derived state or render-time check
function BulkProgressDialog({ progress, onComplete }) {
  const isComplete = progress.completed === progress.total;
  const hasErrors = progress.errors.length > 0;
  const showErrors = isComplete && hasErrors;

  // ... rest of component
}
```

### 7. `src/app/(roles)/admin/invitations/components/invitation-analytics-dashboard.tsx`

#### useEffect #1 (Lines 148-150)
```typescript
useEffect(() => {
  fetchAnalytics();
}, [fetchAnalytics, timeRange]);
```
**Purpose**: Fetch analytics data when time range changes.

**Potential Issues**:
- Dependency on `fetchAnalytics` could cause re-fetching
- No debouncing for rapid time range changes

**Optimization**:
```typescript
// Use SWR with time range as key
import useSWR from 'swr';

function InvitationAnalyticsDashboard({ timeRange }) {
  const { data: analytics, error, isLoading } = useSWR(
    `/api/admin/invitations/analytics?period=${timeRange}`,
    fetcher
  );

  // ... rest of component
}
```

### 8. `src/app/(public)/invite/[code]/invitation-form.tsx`

#### useEffect #1 (Lines 50-54)
```typescript
useEffect(() => {
  if ("success" in state && state.success && "redirectTo" in state) {
    router.push(state.redirectTo);
  }
}, [state, router]);
```
**Purpose**: Handle successful form submission and redirect.

**Potential Issues**:
- Effect runs on every state change
- Could be replaced with form action redirect

**Optimization**:
```typescript
// Use Next.js redirect() in server action
'use server';

export async function acceptInvitation(formData: FormData) {
  // ... validation and processing

  if (success) {
    redirect('/dashboard');
  }

  return { error: 'Failed to accept invitation' };
}
```

### 9. `src/app/(public)/sign-in/page.tsx`

#### useEffect #1 (Lines 26-51)
```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get("message");
  const emailParam = urlParams.get("email");
  const info = urlParams.get("info");

  if (message === "invitation-accepted" && emailParam) {
    setEmail(emailParam);

    if (info === "account-created") {
      toast.success("Account created successfully!", {
        description: "Your invitation has been accepted and your account is ready. Please sign in with your email and password.",
      });
    } else if (info === "contact-admin") {
      toast.success("Invitation accepted!", {
        description: "Please contact your administrator to get your user account created so you can sign in.",
      });
    } else {
      toast.success("Invitation accepted! Please sign in with your email and password.");
    }
  }
}, []);
```
**Purpose**: Handle URL parameters for invitation acceptance messages.

**Potential Issues**:
- Runs only once but could be more robust
- Toast notifications in effect could be missed

**Optimization**:
```typescript
// Use Next.js searchParams in server component
import { redirect } from 'next/navigation';

export default function SignInPage({
  searchParams
}: {
  searchParams: { message?: string; email?: string; info?: string }
}) {
  const { message, email, info } = searchParams;

  // Handle messages server-side or pass to client component
  return <SignInForm initialEmail={email} message={message} info={info} />;
}
```

### 10. `src/app/(dashboard)/profile/page.tsx`

#### useEffect #1 (Lines 125-127)
```typescript
useEffect(() => {
  fetchProfile();
}, []);
```
**Purpose**: Load user profile data on mount.

**Potential Issues**:
- No error handling
- Could be server-side rendered

**Optimization**:
```typescript
// Server component
export default async function ProfilePage() {
  const profile = await fetchProfile();

  return <ProfileForm profile={profile} />;
}
```

### 11. `src/components/team/EditMemberDialog.tsx`

#### useEffect #1 (Lines 80-88)
```typescript
useEffect(() => {
  if (member) {
    form.reset({
      name: member.name,
      role: canEditRole ? member.role : undefined,
      status: canEditStatus ? member.status : undefined,
    });
  }
}, [member, form, canEditRole, canEditStatus]);
```
**Purpose**: Reset form when member data changes.

**Potential Issues**:
- Form reset on every member change
- Dependencies could cause unnecessary resets

**Optimization**:
```typescript
// Use form defaultValues instead
const form = useForm({
  defaultValues: {
    name: member?.name || '',
    role: canEditRole ? member?.role : undefined,
    status: canEditStatus ? member?.status : undefined,
  }
});

// Or use a key to force remount
return (
  <Form key={member?.id} {...form}>
    {/* form content */}
  </Form>
);
```

### 12. `src/components/visit-tracker.tsx`

#### Multiple useEffect instances for tracking

**useEffect #1-4**: Handle various tracking scenarios (visibility, unload, route changes)

**Purpose**: Comprehensive page visit tracking.

**Potential Issues**:
- Multiple effects could conflict
- Complex cleanup logic
- Performance impact from frequent tracking

**Optimization**:
```typescript
// Consolidate into a single custom hook
function usePageTracking(options: TrackingOptions) {
  // Single effect handling all tracking logic
  useEffect(() => {
    if (!options.enabled) return;

    const cleanup = setupTracking(options);
    return cleanup;
  }, [options.enabled, options.trackVisibility, options.trackUnload]);
}
```

### 13. UI Components (`calendar.tsx`, `carousel.tsx`, `sidebar.tsx`)

#### Various useEffect instances

**Purpose**: Handle component-specific side effects like focus management, API setup, keyboard shortcuts.

**Potential Issues**:
- Generally well-implemented for UI interactions
- Some could be optimized but are necessary for functionality

**Optimization**:
These effects are generally appropriate for UI component behavior and don't need major changes.

## General Recommendations

### 1. **Server Components First**
- Convert data-fetching components to server components when possible
- Use `redirect()` and `revalidatePath()` in server actions

### 2. **Client-Side Data Fetching**
- Use SWR or React Query instead of manual useEffect + fetch
- Implement proper caching and error handling

### 3. **Custom Hooks**
- Extract complex useEffect logic into reusable custom hooks
- Consolidate related effects

### 4. **Performance Considerations**
- Memoize expensive operations
- Use `useCallback` for functions passed as dependencies
- Consider debouncing for rapid state changes

### 5. **Error Handling**
- Always include error boundaries
- Handle loading states appropriately
- Implement proper cleanup in effects

## Migration Strategy

1. **Phase 1**: Convert simple data-fetching components to server components
2. **Phase 2**: Replace manual useEffect/fetch with SWR or React Query
3. **Phase 3**: Optimize remaining client-side effects
4. **Phase 4**: Add proper error boundaries and loading states

## Tools and Libraries

- **SWR**: For client-side data fetching with caching
- **React Query**: Alternative to SWR with more features
- **Next.js App Router**: Server components and server actions
- **Error Boundaries**: For graceful error handling

This analysis shows that while useEffect is necessary for certain client-side operations, many instances can be optimized using Next.js features to improve performance and reduce bundle size.