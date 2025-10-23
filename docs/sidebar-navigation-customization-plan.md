# Sidebar Navigation Customization Plan

## Executive Summary

This document outlines a comprehensive plan to customize the sidebar navigation for different user roles in the Tender Hub platform. The goal is to ensure no overlap between admin and manager sections while providing role-appropriate navigation experiences.

## Current System Analysis

### Existing Navigation Structure

**Admin Sidebar** (`admin-sidebar.tsx`):
- ✅ Back to Site
- ✅ Dashboard
- ❌ Manager (should not be accessible to admins)
- ✅ Team Management
- ✅ Provinces
- ✅ Publishers
- ✅ Invitations

**Dashboard Sidebar** (`dashboard-sidebar.tsx`):
- ✅ Back to Site
- ✅ Dashboard
- ✅ Publishers
- ❌ Admin (should only show for admins)
- ❌ Manager (should only show for managers)

**Manager Sidebar** (`manager-sidebar.tsx`):
- ✅ Back to Site
- ✅ Dashboard
- ✅ Team Management
- ✅ Approvals
- ✅ Reports
- ❌ Admin Panel (should not be accessible to managers)

### Critical Issues Identified

1. **Role Overlap**: Admins can access manager sections, managers can access admin sections
2. **No Role-Based Filtering**: Navigation items are static regardless of user permissions
3. **Account Page Location**: Currently in dashboard layout, needs independent layout
4. **Inconsistent Navigation**: Different sidebars show different combinations without clear logic

## Implementation Strategy

### Phase 1: Role-Based Navigation Components

#### 1.1 Create Role-Specific Navigation Logic

**Admin Navigation** (Full Access - includes all manager capabilities):
- Team Management (admin controls - includes user invitation and management)
- Provinces (admin controls)
- Publishers (admin controls)
- Reports (admin access to all reports)
- Account (independent layout - admin can update their own account details)

**Manager Navigation** (Exclusive Access):
- Team Management (manager controls - includes user invitation and management)
- Reports (manager only)
- Account (independent layout - manager can update their own account details)

**User Navigation** (Limited Access):
- Dashboard (general, read-only - publishers states and user activity)
- Publishers (read-only)
- Account (independent layout - users can view their own account details but cannot change email)

#### 1.2 Navigation Filtering Strategy

```typescript
// Role-based navigation filtering
const getNavigationItems = (userRole: string) => {
  const baseItems = [
    { title: "Back to Site", url: "/", icon: Home },
  ];

  const roleSpecificItems = {
    admin: [
      { title: "Team Management", url: "/admin/team", icon: Users },
      { title: "Provinces", url: "/admin/provinces", icon: Map },
      { title: "Publishers", url: "/publishers", icon: BookOpen },
      { title: "Reports", url: "/admin/reports", icon: FileText },
    ],
    manager: [
      { title: "Team Management", url: "/manager/team", icon: Users },
      { title: "Reports", url: "/manager/reports", icon: FileText },
    ],
    user: [
      { title: "Dashboard", url: "/dashboard", icon: Command },
      { title: "Publishers", url: "/publishers", icon: BookOpen },
    ],
  };

  return [...baseItems, ...(roleSpecificItems[userRole] || [])];
};
```

### Phase 2: Independent Account Layout

#### 2.1 Create Account-Specific Layout

**Location**: `src/app/(account)/layout.tsx`

```typescript
// Account layout - independent of main system
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Move Account Page

**From**: `src/app/(dashboard)/account/page.tsx`
**To**: `src/app/(account)/page.tsx`

**Benefits**:
- Independent of main navigation
- Dedicated layout for account management
- No sidebar navigation conflicts
- Cleaner separation of concerns

### Phase 3: Updated Sidebar Components

#### 3.1 Unified Sidebar Component

Create a single, role-aware sidebar component:

```typescript
interface RoleBasedSidebarProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
}

export function RoleBasedSidebar({ user, ...props }: RoleBasedSidebarProps) {
  const navigationItems = getNavigationItems(user.role);

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header with role-specific branding */}
      <SidebarHeader>
        <RoleSpecificHeader role={user.role} />
      </SidebarHeader>

      {/* Navigation items */}
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* User info */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
```

#### 3.2 Role-Specific Headers

```typescript
function RoleSpecificHeader({ role }: { role: string }) {
  const headers = {
    admin: { title: "Tender Hub", subtitle: "Admin", icon: Command, href: "/admin" },
    manager: { title: "Tender Hub", subtitle: "Manager", icon: UserCheck, href: "/manager" },
    user: { title: "Tender Hub", subtitle: "Dashboard", icon: Command, href: "/dashboard" },
  };

  const header = headers[role] || headers.user;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <a href={header.href}>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <header.icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{header.title}</span>
              <span className="truncate text-xs">{header.subtitle}</span>
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

## Technical Implementation

### 4.1 File Structure Changes

```
src/
├── app/
│   ├── (account)/
│   │   ├── layout.tsx          # New independent account layout
│   │   └── page.tsx            # Moved from (dashboard)/account
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Updated to use role-based sidebar
│   │   └── ...
│   ├── (roles)/
│   │   ├── admin/
│   │   │   └── layout.tsx      # Updated to use role-based sidebar
│   │   └── manager/
│   │       └── layout.tsx      # Updated to use role-based sidebar
│   └── ...
├── components/
│   ├── sidebar/
│   │   ├── role-based-sidebar.tsx    # New unified sidebar
│   │   ├── admin-sidebar.tsx         # Deprecated
│   │   ├── dashboard-sidebar.tsx     # Deprecated
│   │   └── manager-sidebar.tsx       # Deprecated
│   └── ...
```

### 4.2 Layout Updates

**Admin Layout** (`src/app/(roles)/admin/layout.tsx`):
```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <SidebarProvider>
      <RoleBasedSidebar user={user} />
      <SidebarInset>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Manager Layout** (`src/app/(roles)/manager/layout.tsx`):
```typescript
export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'manager') {
    redirect('/dashboard');
  }

  return (
    <SidebarProvider>
      <RoleBasedSidebar user={user} />
      <SidebarInset>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Dashboard Layout** (`src/app/(dashboard)/layout.tsx`):
```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <SidebarProvider>
      <RoleBasedSidebar user={user} />
      <SidebarInset>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

## User Experience Impact

### 5.1 Admin Experience
- **Full Access Interface**: Admin can access all features including manager capabilities (Team Management, Provinces, Publishers, Reports)
- **No Navigation Confusion**: Cannot accidentally access unauthorized sections
- **Dedicated Admin Branding**: Clear indication of admin context
- **Independent Account Access**: Account management separate from admin workflow

### 5.2 Manager Experience
- **Focused Manager Tools**: Only manager-relevant features visible (Team Management, Reports)
- **Team Management**: Manager-specific team controls and user invitation capabilities
- **Reporting Access**: Direct access to manager-specific reports
- **Independent Account Access**: Account management separate from manager workflow

### 5.3 User Experience
- **Simplified Interface**: Clean, minimal navigation for regular users (Dashboard, Publishers)
- **Read-Only Access**: Appropriate permissions for user role
- **Dashboard Access**: Read-only view of publishers states and user activity
- **Independent Account Access**: Account management always available (view-only, no email changes)

## Security Considerations

### 6.1 Route Protection
- **Server-Side Role Checks**: All routes verify user permissions
- **Redirect on Unauthorized Access**: Automatic redirect for wrong role access
- **API Endpoint Protection**: Backend validates role permissions

### 6.2 Navigation Security
- **Client-Side Filtering**: Navigation items filtered by role
- **No Hidden Links**: Impossible to access unauthorized sections via navigation
- **Audit Logging**: Track navigation access attempts

## Testing Strategy

### 7.1 Unit Tests
- Navigation item filtering logic
- Role-based component rendering
- Layout permission checks

### 7.2 Integration Tests
- End-to-end navigation flows
- Role switching scenarios
- Account page independence

### 7.3 User Acceptance Testing
- Admin workflow validation
- Manager workflow validation
- User experience verification

## Migration Plan

### 8.1 Phase 1: Infrastructure (Week 1)
- Create role-based sidebar component
- Implement navigation filtering logic
- Create independent account layout

### 8.2 Phase 2: Migration (Week 2)
- Update all layouts to use new components
- Move account page to independent layout
- Update routing configurations

### 8.3 Phase 3: Testing & Polish (Week 3)
- Comprehensive testing
- Performance optimization
- Documentation updates

## Success Metrics

### 9.1 Technical Metrics
- **Zero Navigation Overlap**: No cross-role section access
- **Load Time**: < 2 seconds for navigation rendering
- **Bundle Size**: No significant increase in JavaScript size

### 9.2 User Experience Metrics
- **Navigation Clarity**: 95%+ user understanding of available features
- **Access Efficiency**: Reduced time to access role-appropriate tools
- **Error Reduction**: 90% reduction in unauthorized access attempts

### 9.3 Security Metrics
- **Access Control**: 100% enforcement of role-based permissions
- **Audit Coverage**: Complete logging of navigation and access attempts

## Conclusion

This implementation ensures clean separation between admin and manager sections while providing an independent account management experience. The role-based navigation prevents confusion and unauthorized access, creating a more secure and user-friendly platform.

The phased approach allows for careful implementation and testing, minimizing disruption to existing functionality while delivering significant improvements to user experience and security.

---

**Document Version**: 1.0
**Last Updated**: October 2025
**Author**: Kilo Code (Technical Lead)
**Status**: Ready for Implementation