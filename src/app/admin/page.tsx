import { db } from '@/db';
import { provinces, publishers } from '@/db/schema';
import { count } from 'drizzle-orm';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [provinceCount] = await db.select({ count: count() }).from(provinces);
  const [publisherCount] = await db.select({ count: count() }).from(publishers);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-xl">Provinces</h2>
          <p className="text-2xl">{provinceCount.count}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-xl">Publishers</h2>
          <p className="text-2xl">{publisherCount.count}</p>
        </div>
      </div>
      <nav className="space-y-2">
        <Link href="/admin/provinces" className="block px-4 py-2 bg-blue-500 text-white rounded">
          Manage Provinces
        </Link>
        <Link href="/admin/publishers" className="block px-4 py-2 bg-green-500 text-white rounded">
          Manage Publishers
        </Link>
      </nav>
    </div>
  );
}