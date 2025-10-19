import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { VisitTrackerWithSuspense } from "@/components/visit-tracker";
import { VisitTrackerProvider } from "@/contexts/visit-tracker-context";

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
  robots: {
    index: true,
    follow: true,
  },
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
        <ErrorBoundary>
          <VisitTrackerProvider enabled={true} autoTrack={true}>
            <VisitTrackerWithSuspense
              trackOnMount={true}
              trackVisibility={true}
              trackUnload={true}
              enabled={true}
            />
            <main className="">{children}</main>
            <Toaster />
          </VisitTrackerProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
