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

export const metadata: Metadata = {
  title: "Tender Hub | Dashboard",
  description: "User Dashboard for Tender Hub",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Re-enable server-side authentication when needed
  // For now, let users access the dashboard after client-side sign-in
  
  // Get user data from localStorage for display
  let userData = {
    name: "User",
    email: "user@example.com",
    avatar: `https://avatar.vercel.sh/user@example.com`,
    role: "user",
  };

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
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
