import type { Metadata } from "next";
import DashboardNav from "@/components/dashboard-nav";
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
      <section className="antialiased py-20 overflow-x-hidden">
        <DashboardNav />
        <section >
          {children}
        </section>
      </section>
    </ErrorBoundary>
  );
}
