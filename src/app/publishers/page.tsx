import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import Table from '@/components/Table';

interface SearchParams {
  province?: string;
}

interface PageProps {
  searchParams: SearchParams;
}

export default async function PublishersPage({ searchParams }: PageProps) {
  const provinceFilter = searchParams.province;

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
    .leftJoin(provinces, eq(publishers.province_id, provinces.id))
    .where(provinceFilter ? eq(provinces.name, provinceFilter) : undefined);

  const provincesList = await db.select().from(provinces);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tender Publishers</h1>
      <form className="mb-4">
        <label htmlFor="province" className="block text-sm font-medium mb-2">Filter by Province:</label>
        <select
          id="province"
          name="province"
          className="border border-gray-300 rounded px-3 py-2"
          defaultValue={provinceFilter || ''}
        >
          <option value="">All Provinces</option>
          {provincesList.map((prov) => (
            <option key={prov.id} value={prov.name}>
              {prov.name}
            </option>
          ))}
        </select>
        <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">
          Filter
        </button>
      </form>
      <Table
        data={data}
        columns={[
          { key: 'name', header: 'Publisher' },
          { key: 'website', header: 'Website', render: (value) => value ? <a href={value} target="_blank" className="text-blue-500 underline">{value}</a> : 'N/A' },
          { key: 'provinceName', header: 'Province' },
        ]}
        actions={() => null} // No actions for users
      />
      <div className="mt-6">
        <Link href="/" className="px-4 py-2 bg-gray-500 text-white rounded">
          Back to Home
        </Link>
      </div>
    </div>
  );
}