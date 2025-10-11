import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import Table from '@/components/Table';

export default async function PublishersPage() {
  const data = await db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      province_id: publishers.province_id,
      createdAt: publishers.createdAt,
      provinceName: provinces.name,
    })
    .from(publishers)
    .leftJoin(provinces, eq(publishers.province_id, provinces.id));

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tender Publishers</h1>
      <Table
        data={data}
        columns={[
          { key: 'name', header: 'Publisher' },
          { key: 'website', header: 'Website', render: (value) => value ? <a href={value} target="_blank" className="text-primary underline">{value}</a> : 'N/A' },
          { key: 'provinceName', header: 'Province' },
        ]}
        actions={() => null} // No actions for users
      />
      <div className="mt-6">
        <Link href="/" className="px-4 py-2 bg-secondary text-secondary-foreground rounded cursor-pointer">
          Back to Home
        </Link>
      </div>
    </div>
  );
}