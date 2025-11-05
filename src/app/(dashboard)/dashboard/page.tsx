import { count, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { provinces, publishers } from "@/db/schema";
import { auth } from "@/lib/auth";
import { DashboardContent } from "./dashboard-content";

export default async function Dashboard() {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    redirect('/sign-in');
  }

  const user = session.user;

  // Role-based redirects
  if (user.role === 'admin') {
    redirect('/admin');
  }
  
  if (user.role === 'manager') {
    redirect('/manager');
  }

  // Get dashboard data
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
    <DashboardContent
      user={user}
      provinceCount={provinceCount.count}
      publisherCount={publisherCount.count}
      recentPublishers={recentPublishers}
    />
  );
}
