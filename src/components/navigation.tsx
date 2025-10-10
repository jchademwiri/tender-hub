import Link from "next/link";


export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b border-border/50 z-50">
          <div className="max-w-5xl mx-auto flex justify-between p-4">
            <Link href="/" className="text-xl font-bold text-foreground cursor-pointer">Tender Hub</Link>
            <div className="space-x-4">
              <Link href="/publishers" className="text-foreground hover:text-primary cursor-pointer">Publishers</Link>
              <Link href="/dashboard" className="text-foreground hover:text-primary cursor-pointer">Dashboard</Link>
              <Link href="/admin" className="text-foreground hover:text-primary cursor-pointer">Admin</Link>
            </div>
          </div>
        </nav>
  )
}
