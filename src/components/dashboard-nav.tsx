"use client"

import React, { memo, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavItemWithIndicator } from "@/components/nav-item-with-indicator";
import { useVisitTrackerContext } from "@/contexts/visit-tracker-context";
import {
  LayoutDashboard,
  Building2,
  User,
  LogOut,
  Home
} from "lucide-react";

const DashboardNav = memo(() => {
  const pathname = usePathname();
  const { isEnabled } = useVisitTrackerContext();

  // Memoize navigation items to prevent recreation on every render
  const navigationItems = useMemo(() => [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      ariaLabel: "Go to Dashboard"
    },
    {
      href: "/publishers",
      label: "Publishers",
      icon: <Building2 className="w-4 h-4" />,
      ariaLabel: "Go to Publishers"
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="w-4 h-4" />,
      ariaLabel: "Go to Profile"
    }
  ], []);

  // Memoize logout handler to prevent unnecessary re-renders of logout button
  const handleLogout = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // Add logout logic here
    console.log("Logout clicked");
  }, []);

  // Show only on dashboard and publishers paths
  if (!pathname.startsWith('/dashboard') && pathname !== '/publishers' && pathname !== '/profile') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b border-border/50 z-50">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center py-4">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
          aria-label="Go to Dashboard Home"
        >
          <Home className="w-5 h-5" />
          Tender Hub
        </Link>

        <div className="flex items-center space-x-2">
          {navigationItems.map((item) => (
            <NavItemWithIndicator
              key={item.href}
              href={item.href}
              ariaLabel={item.ariaLabel}
              showIndicator={isEnabled}
              icon={item.icon}
              className="transition-all duration-200"
            >
              {item.label}
            </NavItemWithIndicator>
          ))}

          {/* Logout button - no visit tracking */}
          <Link
            href="#"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
            aria-label="Logout from application"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </div>
    </nav>
  );
});

DashboardNav.displayName = 'DashboardNav';

export default DashboardNav;