import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deletePublisher } from '@/server';

interface PageProps {
  params: { id: string };
}

export default async function PublisherView({ params }: PageProps) {
  const [publisher] = await db
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
    .where(eq(publishers.id, params.id));

  if (!publisher) notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{publisher.name}</h1>
      <div className="space-y-2">
        <p><strong>Website:</strong> {publisher.website ? <a href={publisher.website} target="_blank" className="text-blue-500">{publisher.website}</a> : 'N/A'}</p>
        <p><strong>Province:</strong> {publisher.provinceName || 'N/A'}</p>
        <p><strong>Created At:</strong> {new Date(publisher.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="mt-6 space-x-4">
        <Link href={`/admin/publishers/${publisher.id}/edit`} className="px-4 py-2 bg-primary text-primary-foreground rounded">
          Edit
        </Link>
        <form action={deletePublisher.bind(null, publisher.id)} className="inline">
          <button type="submit" className="px-4 py-2 bg-destructive text-destructive-foreground rounded">
            Delete
          </button>
        </form>
        <Link href="/admin/publishers" className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
          Back to List
        </Link>
      </div>
    </div>
  );
}