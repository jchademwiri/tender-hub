import type { Metadata } from "next";

import PublicNav from "@/components/public-nav";

export const metadata: Metadata = {
  title: "Tender Hub",
  description: "Browse tender publishers by province",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <PublicNav />
      <section className="pt-24">{children}</section>
    </section>
  );
}
