import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
// import { requireAuth } from "@/lib/auth-utils";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Tender Hub | Dashboard",
  description: "User Dashboard for Tender Hub",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Authentication temporarily disabled
  // await requireAuth();

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
