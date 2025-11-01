export const dynamic = "force-dynamic";

import type { Metadata } from "next";
// import { requireAuth } from "@/lib/auth-utils";
import { ErrorBoundary } from "@/components/error-boundary";
import { RoleBasedSidebar } from "@/components/sidebar/role-based-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Tender Hub | Dashboard",
  description: "User Dashboard for Tender Hub",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Enable authentication for dashboard
  const session = await requireAuth();

  const userData = {
    name: session.user.name || "User",
    email: session.user.email,
    avatar: session.user.image || `https://avatar.vercel.sh/${session.user.email}`,
    role: session.user.role || "user",
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
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
