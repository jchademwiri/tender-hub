export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { RoleBasedSidebar } from "@/components/sidebar/role-based-sidebar";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

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
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Check if user has manager or admin role
  if (!['admin', 'manager'].includes(session.user.role || '')) {
    redirect('/dashboard');
  }
  
  return (
    <ErrorBoundary>
      <SidebarProvider>
        <RoleBasedSidebar user={session.user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <DynamicBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
