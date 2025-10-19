import type { Metadata } from "next";
import { ManagerSidebar } from "@/components/manager-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { requireManager } from "@/lib/auth-utils";
import { ErrorBoundary } from "@/components/error-boundary";

/**
 * TODO: Manager Role Implementation Checklist
 *
 * LAYOUT & AUTHENTICATION:
 * [ ] Implement requireManager middleware with proper error handling
 * [ ] Add role-based session validation for manager level
 * [ ] Implement manager activity tracking
 * [ ] Add manager-specific security headers
 * [ ] Implement manager session timeout handling
 *
 * MANAGER DASHBOARD FEATURES:
 * [ ] Team performance and productivity metrics
 * [ ] User activity monitoring for managed users
 * [ ] Invitation management for team members
 * [ ] Profile update approval workflow
 * [ ] Department/project specific analytics
 *
 * MANAGER NAVIGATION ENHANCEMENTS:
 * [ ] Quick access to team management tools
 * [ ] Pending approvals and notifications
 * [ ] Team member status overview
 * [ ] Recent team activities
 * [ ] Manager-specific shortcuts
 *
 * MANAGER WORKFLOWS:
 * [ ] Profile update review and approval process
 * [ ] Team member invitation and onboarding
 * [ ] Performance review and feedback systems
 * [ ] Resource allocation and project management
 * [ ] Team communication and collaboration tools
 */

export const metadata: Metadata = {
  title: "Tender Hub | Manager Dashboard",
  description: "Team management and operational oversight",
};

export default async function ManagerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Enable manager authentication check
  const { requireManager } = await import("@/lib/auth-utils");
  const user = await requireManager();

  const userData = {
    name: user.name || "Manager",
    email: user.email,
    avatar: user.image || `https://avatar.vercel.sh/${user.email}`,
  };

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <ManagerSidebar user={userData} />
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
                    <BreadcrumbPage>Manager</BreadcrumbPage>
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