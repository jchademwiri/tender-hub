import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
    <>
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
          <div className="grid gap-4 mb-8 md:grid-cols-2">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">Total Provinces</h2>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{provinceCount.count}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">Total Publishers</h2>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">{publisherCount.count}</p>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Publishers</h2>
            <div className="bg-card rounded-lg border shadow-sm">
              <ul className="divide-y divide-border">
                {recentPublishers.map((pub) => (
                  <li key={pub.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-foreground">{pub.name}</strong>
                        <span className="text-muted-foreground ml-2">- {pub.provinceName}</span>
                        <span className="text-muted-foreground ml-2">({new Date(pub.createdAt).toLocaleDateString()})</span>
                      </div>
                      {pub.website && (
                        <a
                          href={pub.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          Visit Website
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/publishers"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
            >
              Browse Publishers
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-center font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}