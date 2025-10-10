import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteProvince } from '@/server';

interface PageProps {
  params: { id: string };
}

export default async function ProvinceView({ params }: PageProps) {
  const [province] = await db.select().from(provinces).where(eq(provinces.id, params.id));

  if (!province) notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{province.name}</h1>
      <div className="space-y-2">
        <p><strong>Code:</strong> {province.code}</p>
        <p><strong>Description:</strong> {province.description}</p>
        <p><strong>Created At:</strong> {new Date(province.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="mt-6 space-x-4">
        <Link href={`/admin/provinces/${province.id}/edit`} className="px-4 py-2 bg-primary text-primary-foreground rounded">
          Edit
        </Link>
        <form action={deleteProvince.bind(null, province.id)} className="inline">
          <button type="submit" className="px-4 py-2 bg-destructive text-destructive-foreground rounded">
            Delete
          </button>
        </form>
        <Link href="/admin/provinces" className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
          Back to List
        </Link>
      </div>
    </div>
  );
}