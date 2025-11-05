import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { provinces, publishers } from "@/db/schema";
import { DashboardContent } from "./dashboard-content";

export default async function Dashboard() {
  // Get dashboard data without requiring server-side authentication
  // User authentication is handled client-side for this demo
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

  // Mock user data for demo purposes
  // In a real app, this would come from proper server-side session management
  const mockUser = {
    id: "demo-user",
    name: "Demo User",
    email: "demo@example.com",
    role: "user",
  };

  return (
    <DashboardContent
      user={mockUser}
      provinceCount={provinceCount.count}
      publisherCount={publisherCount.count}
      recentPublishers={recentPublishers}
    />
  );
}
