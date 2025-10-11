"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardNav() {
  const pathname = usePathname();

  // Show only on dashboard and publishers paths
  if (!pathname.startsWith('/dashboard') && pathname !== '/publishers' && pathname !== '/profile') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b border-border/50 z-50">
      <div className="max-w-5xl mx-auto flex justify-between py-4">
        <Link href="/dashboard" className="text-xl font-bold text-foreground cursor-pointer">Tender Hub</Link>
        <div className="space-x-4">
          <Link href="/dashboard" className="text-foreground hover:text-primary cursor-pointer">Dashboard</Link>
          <Link href="/publishers" className="text-foreground hover:text-primary cursor-pointer">Publishers</Link>
          <Link href="/profile" className="text-foreground hover:text-primary cursor-pointer">Profile</Link>
          <Link href="#" className="text-foreground hover:text-primary cursor-pointer">Logout</Link>
        </div>
      </div>
    </nav>
  );
}