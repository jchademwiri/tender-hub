import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import { requireAdmin } from "@/lib/auth-utils";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Tender Hub | Admin",
  description: "Admin Dashboard for Tender Hub",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Authentication temporarily disabled
  // await requireAdmin();

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
