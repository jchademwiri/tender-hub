import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import Table from '@/components/Table';
import { Province } from '@/db/schema';
import { deleteProvince } from '@/server';

export default async function ProvincesPage() {
  const data = await db.select().from(provinces);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Provinces</h1>
      <Link href="/admin/provinces/create" className="mb-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded">
        Add Province
      </Link>
      <Table
        data={data}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'code', header: 'Code' },
          { key: 'description', header: 'Description' },
          { key: 'createdAt', header: 'Created At', render: (value) => new Date(value).toLocaleDateString() },
        ]}
        actions={(item: Province) => (
          <div className="space-x-2">
            <Link href={`/admin/provinces/${item.id}`} className="text-primary">View</Link>
            <Link href={`/admin/provinces/${item.id}/edit`} className="text-primary">Edit</Link>
            <form action={deleteProvince.bind(null, item.id)} className="inline">
              <button type="submit" className="text-destructive">Delete</button>
            </form>
          </div>
        )}
      />
    </div>
  );
}