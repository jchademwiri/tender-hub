import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { pageViews, provinces, publishers } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

export default async function MostVisitedPage() {
  // Get authenticated user
  const session = await requireAuth();

  // Get most visited publishers based on page views
  const mostVisitedPublishers = await db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      provinceName: provinces.name,
      visitCount: count(pageViews.id),
    })
    .from(publishers)
    .leftJoin(provinces, eq(publishers.province_id, provinces.id))
    .leftJoin(pageViews, eq(pageViews.url, publishers.website))
    .where(eq(pageViews.userId, session.user.id))
    .groupBy(publishers.id, publishers.name, publishers.website, provinces.name)
    .orderBy(desc(count(pageViews.id)))
    .limit(10);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Most Visited Publishers
          </h1>
          <p className="text-muted-foreground">
            Publishers you've visited most frequently
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mostVisitedPublishers.map((publisher, index) => (
            <Card key={publisher.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{publisher.name}</CardTitle>
                  <span className="text-2xl font-bold text-primary">
                    #{index + 1}
                  </span>
                </div>
                <CardDescription>{publisher.provinceName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {publisher.website && (
                    <Link
                      href={publisher.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {publisher.website}
                    </Link>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Visits</span>
                    <span className="font-medium">{publisher.visitCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mostVisitedPublishers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No visit data available yet. Start visiting publishers to see your
              most visited list.
            </p>
          </div>
        )}

        <div className="flex justify-start">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
