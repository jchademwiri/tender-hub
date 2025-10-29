# User Management Improvement Plan: Suspended Status

## 1. Objective

This document outlines an implementation plan to enhance user management by properly handling the `suspended` status for users. The goal is to prevent suspended users from accessing the application and to provide them with clear information about their account status.

## 2. Proposed Changes

### 2.1. Middleware for Handling Suspended Users

We will use the `before` hook in the `better-auth` configuration (`src/lib/auth.ts`) to check the user's status before the sign-in process is completed.

-   **Logic:**
    -   The hook will trigger on the sign-in route.
    -   It will fetch the user's data from the database.
    -   If the user's `status` is `suspended`, the hook will throw an `APIError` with a custom message and a `USER_SUSPENDED` code.

**File to modify:** `src/lib/auth.ts`

```typescript
// src/lib/auth.ts

// ... existing code

  hooks: {
    before: async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const { email } = ctx.body;
        const user = await db.query.user.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        if (user && user.status === 'suspended') {
          throw new APIError('FORBIDDEN', {
            message: 'Your account has been suspended.',
            code: 'USER_SUSPENDED',
          });
        }
      }
    },
    after: createAuthMiddleware(async (ctx) => {
      // ... existing logging logic
    }),
  },

// ... existing code
```

### 2.2. Client-Side Handling and Redirection

The sign-in page will be updated to catch the `USER_SUSPENDED` error and redirect the user to a new `/suspended` page.

-   **Logic:**
    -   In the `signIn` function on the sign-in page, the `onError` callback will check for the specific error code.
    -   If the error code is `USER_SUSPENDED`, the user will be redirected to the `/suspended` page.

**File to modify:** `src/app/(public)/sign-in/page.tsx`

### 2.3. Suspended Page

A new page will be created to inform suspended users about their account status.

-   **Route:** `/suspended`
-   **Content:**
    -   A clear message stating that the account has been suspended.
    -   Instructions to contact a manager or administrator to resolve the issue.
    -   A link to the main page.

**New file:** `src/app/(public)/suspended/page.tsx`

```tsx
// src/app/(public)/suspended/page.tsx

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SuspendedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Suspended</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Your account has been suspended. Please contact a manager or administrator for further assistance.
          </p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.4. API Endpoint Protection

The existing API for updating user information already prevents a manager from suspending an admin. This is handled by the `canSuspendUser` method in `src/lib/permissions.ts`, which is used in the `PUT` handler of `src/app/api/team/[id]/route.ts`. No changes are required for this part.

## 3. File Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── sign-in/
│   │   │   └── page.tsx            # Modified
│   │   └── suspended/
│   │       └── page.tsx            # New
└── lib/
    └── auth.ts                     # Modified
```

## 4. Implementation Steps

1.  **Create the Suspended Page:**
    -   Create the new directory `src/app/(public)/suspended`.
    -   Create the new file `page.tsx` inside the new directory with the content from section 2.3.

2.  **Update the Auth Hook:**
    -   Modify `src/lib/auth.ts` to include the `before` hook as described in section 2.1.

3.  **Update the Sign-in Page:**
    -   Modify the `signIn` call in `src/app/(public)/sign-in/page.tsx` to handle the `USER_SUSPENDED` error and redirect to the `/suspended` page.

4.  **Testing:**
    -   Create a user with the `user` role and set their status to `suspended`.
    -   Attempt to log in as the suspended user and verify that you are redirected to the `/suspended` page.
    -   As a `manager`, attempt to suspend an `admin` user and verify that the API returns a `403 Forbidden` error.

## 5. Security Considerations

-   The `before` hook in `better-auth` runs on the server-side, so the user's status is checked securely before any session is created.
-   The API endpoint for updating user status is already protected by role-based access control, preventing unauthorized modifications.
