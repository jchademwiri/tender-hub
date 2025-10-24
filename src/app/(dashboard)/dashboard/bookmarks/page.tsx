import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { userBookmarks, publishers, provinces } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

export default async function BookmarksPage() {
  // Get authenticated user
  const user = await requireAuth();

  // Get user's bookmarked publishers
  const bookmarkedPublishers = await db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      provinceName: provinces.name,
      bookmarkedAt: userBookmarks.createdAt,
    })
    .from(userBookmarks)
    .innerJoin(publishers, eq(userBookmarks.publisherId, publishers.id))
    .leftJoin(provinces, eq(publishers.province_id, provinces.id))
    .where(eq(userBookmarks.userId, user.id))
    .orderBy(desc(userBookmarks.createdAt));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bookmarked Publishers
          </h1>
          <p className="text-muted-foreground">
            Your saved publishers for quick access
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarkedPublishers.map((publisher) => (
            <Card key={publisher.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{publisher.name}</CardTitle>
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
                    <span>Bookmarked</span>
                    <span className="font-medium">
                      {new Date(publisher.bookmarkedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {bookmarkedPublishers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No bookmarks yet. Visit the publishers page to bookmark your
              favorite publishers.
            </p>
            <Link
              href="/dashboard/publishers"
              className="inline-flex items-center justify-center px-4 py-2 mt-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Browse Publishers
            </Link>
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
