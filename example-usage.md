# Using Auth Utils with Roles

## Problem Solved
The issue was that Better Auth wasn't including custom user fields (like `role`, `status`) in the session data. 

## Solution
Created `getSessionWithRole()` utility that fetches the full user data from the database and merges it with the session.

## Usage Examples

### In Server Components
```typescript
import { getSessionWithRole, requireAdmin } from '@/lib/auth-utils';

export default async function AdminPage() {
  const session = await getSessionWithRole();
  
  if (!session) {
    redirect('/sign-in');
  }
  
  console.log('User role:', session.user.role); // Now includes role!
  
  return <div>Welcome {session.user.name} ({session.user.role})</div>;
}
```

### In API Routes
```typescript
import { requireAdmin, requireManager } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const session = await requireAdmin();
    
    // User is authenticated and has admin role
    console.log('Admin user:', session.user.email, session.user.role);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
```

### Available Functions
- `getSession()` - Basic session (no role info)
- `getSessionWithRole()` - Session with full user data including role
- `requireAuth()` - Throws error if not authenticated
- `requireRole(['admin', 'manager'])` - Requires specific roles
- `requireAdmin()` - Requires admin or owner role
- `requireManager()` - Requires manager, admin, or owner role

## Test Credentials
- Email: `admin-test@example.com`
- Password: `adminpass123`
- Role: `admin`