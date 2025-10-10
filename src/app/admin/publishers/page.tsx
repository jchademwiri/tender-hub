import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import Table from '@/components/Table';
import { Publisher } from '@/db/schema';
import { deletePublisher } from '@/server';

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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Publishers</h1>
      <Link href="/admin/publishers/create" className="mb-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded">
        Add Publisher
      </Link>
      <Table
        data={data}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'website', header: 'Website', render: (value) => value ? <a href={value} target="_blank" className="text-blue-500">{value}</a> : 'N/A' },
          { key: 'provinceName', header: 'Province' },
          { key: 'createdAt', header: 'Created At', render: (value) => new Date(value).toLocaleDateString() },
        ]}
        actions={(item: any) => (
          <div className="space-x-2">
            <Link href={`/admin/publishers/${item.id}`} className="text-primary">View</Link>
            <Link href={`/admin/publishers/${item.id}/edit`} className="text-primary">Edit</Link>
            <form action={deletePublisher.bind(null, item.id)} className="inline">
              <button type="submit" className="text-destructive">Delete</button>
            </form>
          </div>
        )}
      />
    </div>
  );
}