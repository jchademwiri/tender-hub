import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tender Hub | Admin",
  description: "Admin Dashboard for Tender Hub",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
        <section>
          {children}
        </section>
     
  );
}
