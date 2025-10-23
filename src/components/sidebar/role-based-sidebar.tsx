"use client";

import { BookOpen, Command, FileText, Home, Map, UserCheck, Users } from "lucide-react";
import type * as React from "react";
import Link from "next/link";

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
  const baseItems = [
    { title: "Back to Site", url: "/", icon: Home },
  ];

  const roleSpecificItems: Record<string, Array<{ title: string; url: string; icon: React.ComponentType<any> }>> = {
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

function RoleSpecificHeader({ role }: { role: string }) {
  const headers: Record<string, { title: string; subtitle: string; icon: React.ComponentType<any>; href: string }> = {
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