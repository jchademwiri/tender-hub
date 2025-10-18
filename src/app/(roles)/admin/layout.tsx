import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { requireAdmin } from "@/lib/auth-utils";
import { ErrorBoundary } from "@/components/error-boundary";

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
  // Enable admin authentication check
  await requireAdmin();

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Admin</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}