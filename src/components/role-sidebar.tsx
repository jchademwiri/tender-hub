"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * TODO: Role-Based Sidebar Implementation Checklist
 *
 * ADMIN SIDEBAR FEATURES:
 * [ ] System health monitoring widgets
 * [ ] Real-time notification system
 * [ ] Quick action buttons for admin tasks
 * [ ] User activity and audit log previews
 * [ ] System performance metrics display
 *
 * MANAGER SIDEBAR FEATURES:
 * [ ] Team member status overview
 * [ ] Pending approval notifications
 * [ ] Quick access to team management
 * [ ] Performance dashboard widgets
 * [ ] Team communication shortcuts
 *
 * USER SIDEBAR FEATURES:
 * [ ] Personal profile status
 * [ ] Activity history preview
 * [ ] Quick settings access
 * [ ] Help and support shortcuts
 * [ ] Account management options
 *
 * SHARED SIDEBAR FEATURES:
 * [ ] Role-based navigation items
 * [ ] Dynamic menu generation based on permissions
 * [ ] Collapsible sections and responsive design
 * [ ] Search functionality within sidebar
 * [ ] Recent items and favorites
 */

interface SidebarProps {
  role: "admin" | "manager" | "user";
  className?: string;
}

interface NavigationItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavigationItem[];
}

export function RoleSidebar({ role, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // TODO: Generate navigation items based on role
  const navigationItems = getNavigationItems(role);

  return (
    <div className={cn("flex h-full flex-col border-r bg-background", className)}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold capitalize">{role} Panel</h2>
            <Badge variant="outline" className="text-xs">
              {getRoleDisplayName(role)}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? "→" : "←"}
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <Separator className="mb-4" />
        <div className="space-y-2">
          {!collapsed && (
            <>
              <div className="text-xs text-muted-foreground">
                {getRoleStats(role)}
              </div>
              <RoleQuickActions role={role} collapsed={collapsed} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface SidebarNavItemProps {
  item: NavigationItem;
  pathname: string;
  collapsed: boolean;
}

function SidebarNavItem({ item, pathname, collapsed }: SidebarNavItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  if (item.children) {
    return (
      <div className="space-y-1">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-10",
            collapsed && "justify-center px-2"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {item.icon && <item.icon className="mr-2 h-4 w-4" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
              <span className="ml-2">{expanded ? "▼" : "▶"}</span>
            </>
          )}
        </Button>
        {expanded && !collapsed && (
          <div className="ml-4 space-y-1">
            {item.children.map((child) => (
              <Link key={child.href} href={child.href}>
                <Button
                  variant={pathname === child.href ? "secondary" : "ghost"}
                  className="w-full justify-start h-8 text-sm"
                >
                  {child.title}
                  {child.badge && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {child.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start h-10",
          collapsed && "justify-center px-2"
        )}
      >
        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Button>
    </Link>
  );
}

function RoleQuickActions({ role, collapsed }: { role: string; collapsed: boolean }) {
  const actions = getQuickActions(role);

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            ⚡
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((action) => (
            <DropdownMenuItem key={action.label} asChild>
              <Link href={action.href}>{action.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-1">
      {actions.map((action) => (
        <Button key={action.label} variant="outline" size="sm" className="w-full justify-start" asChild>
          <Link href={action.href}>
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

// TODO: Role-specific navigation configuration
function getNavigationItems(role: string): NavigationItem[] {
  const baseItems: Record<string, NavigationItem[]> = {
    admin: [
      {
        title: "Dashboard",
        href: "/admin",
        badge: "New"
      },
      {
        title: "User Management",
        href: "/admin/users",
        children: [
          { title: "All Users", href: "/admin/users" },
          { title: "Invite Users", href: "/admin/users/invite" },
          { title: "User Roles", href: "/admin/users/roles" }
        ]
      },
      {
        title: "System",
        href: "/admin/system",
        children: [
          { title: "Health Monitor", href: "/admin/system/health" },
          { title: "Audit Logs", href: "/admin/system/audit" },
          { title: "Settings", href: "/admin/system/settings" }
        ]
      }
    ],
    manager: [
      {
        title: "Dashboard",
        href: "/manager",
      },
      {
        title: "Team Management",
        href: "/manager/team",
        children: [
          { title: "My Team", href: "/manager/team" },
          { title: "Team Analytics", href: "/manager/team/analytics" },
          { title: "Team Reports", href: "/manager/team/reports" }
        ]
      },
      {
        title: "Approvals",
        href: "/manager/approvals",
        badge: "3" // TODO: Get actual pending count
      }
    ],
    user: [
      {
        title: "Dashboard",
        href: "/user",
      },
      {
        title: "Profile",
        href: "/user/profile",
        children: [
          { title: "My Profile", href: "/user/profile" },
          { title: "Account Settings", href: "/user/profile/settings" },
          { title: "Privacy", href: "/user/profile/privacy" }
        ]
      },
      {
        title: "Activity",
        href: "/user/activity",
      }
    ]
  };

  return baseItems[role] || [];
}

function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    admin: "Administrator",
    manager: "Manager",
    user: "User"
  };
  return displayNames[role] || role;
}

function getRoleStats(role: string): string {
  // TODO: Get actual stats based on role
  const stats: Record<string, string> = {
    admin: "5 users online • 2 pending invites",
    manager: "12 team members • 3 approvals pending",
    user: "Profile 85% complete • 23 recent actions"
  };
  return stats[role] || "";
}

function getQuickActions(role: string): { label: string; href: string }[] {
  const actions: Record<string, { label: string; href: string }[]> = {
    admin: [
      { label: "Invite User", href: "/admin/users/invite" },
      { label: "View Audit Log", href: "/admin/system/audit" },
      { label: "System Health", href: "/admin/system/health" }
    ],
    manager: [
      { label: "Review Approvals", href: "/manager/approvals" },
      { label: "Team Report", href: "/manager/team/reports" },
      { label: "Invite Member", href: "/manager/team/invite" }
    ],
    user: [
      { label: "Update Profile", href: "/user/profile" },
      { label: "Download Data", href: "/user/profile/privacy" },
      { label: "Get Help", href: "/user/help" }
    ]
  };
  return actions[role] || [];
}