import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppBreadcrumbs } from '@/components/app-breadcrumbs';

export default async function Dashboard() {
  // Placeholder: since no user auth, show summary
  const [provinceCount] = await db.select({ count: count() }).from(provinces);
  const [publisherCount] = await db.select({ count: count() }).from(publishers);

  // Recent publishers
  const recentPublishers = await db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      provinceName: provinces.name,
      createdAt: publishers.createdAt,
    })
    .from(publishers)
    .leftJoin(provinces, eq(publishers.province_id, provinces.id))
    .orderBy(desc(publishers.createdAt))
    .limit(5);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <AppBreadcrumbs />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="w-full max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-100 p-4 rounded">
                <h2 className="text-xl">Total Provinces</h2>
                <p className="text-2xl">{provinceCount.count}</p>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <h2 className="text-xl">Total Publishers</h2>
                <p className="text-2xl">{publisherCount.count}</p>
              </div>
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Recent Publishers</h2>
              <ul className="space-y-2">
                {recentPublishers.map((pub) => (
                  <li key={pub.id} className="border p-2 rounded">
                    <strong>{pub.name}</strong> - {pub.provinceName} ({new Date(pub.createdAt).toLocaleDateString()})
                    {pub.website && <a href={pub.website} target="_blank" className="ml-2 text-blue-500">Visit</a>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-x-4">
              <Link href="/publishers" className="px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer">
                Browse Publishers
              </Link>
              <Link href="/" className="px-4 py-2 bg-secondary text-secondary-foreground rounded cursor-pointer">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}