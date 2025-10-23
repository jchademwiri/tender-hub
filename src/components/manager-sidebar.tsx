"use client";

import {
  BookOpen,
  CheckCircle,
  Command,
  FileText,
  Home,
  Map,
  Settings2,
  UserCheck,
  Users,
} from "lucide-react";
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

interface ManagerSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

const navMain = [
  {
    title: "Back to Site",
    url: "/",
    icon: Home,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Command,
  },
  {
    title: "Team Management",
    url: "/manager/team",
    icon: Users,
  },
  {
    title: "Approvals",
    url: "/manager/approvals",
    icon: CheckCircle,
  },
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
  {
    title: "Admin Panel",
    url: "/admin",
    icon: Settings2,
  },
];

export function ManagerSidebar({ user, ...props }: ManagerSidebarProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/manager">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <UserCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Tender Hub</span>
                  <span className="truncate text-xs">Manager</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
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
