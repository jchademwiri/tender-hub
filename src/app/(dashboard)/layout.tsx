import type { Metadata } from "next";
import DashboardNav from "@/components/dashboard-nav";

export const metadata: Metadata = {
  title: "Tender Hub | Dashboard",
  description: "User Dashboard for Tender Hub",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="antialiased py-20">
      <DashboardNav />
      <section >
        {children}
      </section>
    </section>
  );
}
