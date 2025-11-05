export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/error-boundary";
import { RoleBasedSidebar } from "@/components/sidebar/role-based-sidebar";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * TODO: Admin Role Implementation Checklist
 *
 * LAYOUT & AUTHENTICATION:
 * [ ] Implement requireAdmin middleware with proper error handling
 * [ ] Add role-based session validation
 * [ ] Implement admin activity tracking
 * [ ] Add admin-specific security headers
 * [ ] Implement admin session timeout handling
 *
 * ADMIN SIDEBAR ENHANCEMENTS:
 * [ ] Add system health monitoring widgets
 * [ ] Implement real-time notification system
 * [ ] Add quick action buttons for common admin tasks
 * [ ] Create admin analytics overview panel
 * [ ] Add system status indicators
 *
 * ADMIN DASHBOARD FEATURES:
 * [ ] System performance metrics dashboard
 * [ ] User activity monitoring
 * [ ] Security audit log viewer
 * [ ] Database health and backup status
 * [ ] API rate limiting and usage stats
 */

export const metadata: Metadata = {
  title: "Tender Hub | Admin Dashboard",
  description: "Administrative control panel for Tender Hub platform",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Re-enable server-side authentication when needed
  // For now, let users access the admin area after client-side sign-in
  
  // Get user data from localStorage for display
  let userData = {
    name: "Admin User",
    email: "admin@example.com",
    avatar: `https://avatar.vercel.sh/admin@example.com`,
    role: "admin",
  };

  // In a real implementation, you would validate the user here
  // For now, this allows access after client-side authentication

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <RoleBasedSidebar user={userData} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DynamicBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
