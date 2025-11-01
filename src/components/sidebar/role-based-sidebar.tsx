"use client";

import {
  Bookmark,
  BookOpen,
  Command,
  Database,
  FileText,
  Home,
  Mail,
  Map,
  Monitor,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface RoleBasedSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
}

// Role-based navigation filtering
const getNavigationItems = (userRole: string) => {
  const baseItems = [{ title: "Back to Site", url: "/", icon: Home }];

  const roleSpecificItems: Record<
    string,
    Array<{ title: string; url: string; icon: React.ComponentType<any> }>
  > = {
    admin: [
      { title: "Dashboard", url: "/admin", icon: Command },
      { title: "Monitoring", url: "/admin/monitoring", icon: Monitor },
      { title: "Team", url: "/admin/team", icon: Users },
      { title: "Provinces", url: "/admin/provinces", icon: Map },
      { title: "Publishers", url: "/admin/publishers", icon: BookOpen },
      { title: "Invitations", url: "/admin/invitations", icon: Mail },
      { title: "Database", url: "/admin/database", icon: Database },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: FileText },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Command,
      },
    ],
    manager: [
      {
        title: "Dashboard",
        url: "/manager",
        icon: Command,
      },
      {
        title: "Team",
        url: "/manager/team",
        icon: Users,
      },
      // {
      //   title: "Approvals",
      //   url: "/manager/approvals",
      //   icon: CheckCircle,
      // },
      {
        title: "Provinces",
        url: "/manager/provinces",
        icon: Map,
      },
      {
        title: "Publishers",
        url: "/manager/publishers",
        icon: BookOpen,
      },
      {
        title: "Reports",
        url: "/manager/reports",
        icon: FileText,
      },
    ],
    user: [
      { title: "Dashboard", url: "/dashboard", icon: Command },
      { title: "Publishers", url: "/dashboard/publishers", icon: BookOpen },
      {
        title: "Most Visited",
        url: "/dashboard/most-visited",
        icon: TrendingUp,
      },
      { title: "Bookmarks", url: "/dashboard/bookmarks", icon: Bookmark },
    ],
  };

  return [...baseItems, ...(roleSpecificItems[userRole] || [])];
};

function RoleSpecificHeader({ role }: { role: string }) {
  const headers: Record<
    string,
    {
      title: string;
      subtitle: string;
      icon: React.ComponentType<any>;
      href: string;
    }
  > = {
    admin: {
      title: "Tender Hub",
      subtitle: "Admin",
      icon: Command,
      href: "/admin",
    },
    manager: {
      title: "Tender Hub",
      subtitle: "Manager",
      icon: UserCheck,
      href: "/manager",
    },
    user: {
      title: "Tender Hub",
      subtitle: "Dashboard",
      icon: Command,
      href: "/dashboard",
    },
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

export function RoleBasedSidebar({ user, ...props }: RoleBasedSidebarProps) {
  const navigationItems = getNavigationItems(user.role);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <RoleSpecificHeader role={user.role} />
      </SidebarHeader>
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
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
