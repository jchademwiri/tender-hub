import type { Metadata } from "next";


import Navigation from "@/components/navigation";



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
    <section className="antialiased py-8 pt-24">
      <Navigation />
      <section >
        {children}
      </section>
    </section>
  );
}
