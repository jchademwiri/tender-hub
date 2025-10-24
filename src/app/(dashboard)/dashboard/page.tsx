import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { provinces, publishers } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { DashboardContent } from "./dashboard-content";

export default async function Dashboard() {
  // Get authenticated user
  const user = await requireAuth();

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

  // Serialize user object to prevent serialization errors
  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return (
    <DashboardContent
      user={serializedUser}
      provinceCount={provinceCount.count}
      publisherCount={publisherCount.count}
      recentPublishers={recentPublishers}
    />
  );
}
