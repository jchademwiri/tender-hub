"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PublicNav() {
  const pathname = usePathname();

  // Don't show on dashboard, admin, or publishers paths
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/publishers') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b border-border/50 z-50">
      <div className="max-w-5xl mx-auto flex justify-between py-4">
        <Link href="/" className="text-xl font-bold text-foreground cursor-pointer">Tender Hub</Link>
        <div className="space-x-4">
          <Link href="#" className="text-foreground hover:text-primary cursor-pointer">About</Link>
          <Link href="#" className="text-foreground hover:text-primary cursor-pointer">Contact</Link>
          <Link href="#" className="text-foreground hover:text-primary cursor-pointer">Login</Link>
          <Link href="#" className="text-foreground hover:text-primary cursor-pointer">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
}