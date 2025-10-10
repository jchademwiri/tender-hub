import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-card border-b border-border p-4">
          <div className="container mx-auto flex justify-between">
            <Link href="/" className="text-xl font-bold text-foreground">Tender Hub</Link>
            <div className="space-x-4">
              <Link href="/publishers" className="text-foreground hover:text-primary">Publishers</Link>
              <Link href="/dashboard" className="text-foreground hover:text-primary">Dashboard</Link>
              <Link href="/admin" className="text-foreground hover:text-primary">Admin</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
