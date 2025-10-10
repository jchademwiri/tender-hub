import { db } from '@/db';
import { publishers, provinces, Publisher } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PublisherForm from '@/components/PublisherForm';
import { notFound } from 'next/navigation';
import { updatePublisher } from '@/server';

interface PageProps {
  params: { id: string };
}

export default async function EditPublisher({ params }: PageProps) {
  const [publisher] = await db
    .select()
    .from(publishers)
    .where(eq(publishers.id, params.id)) as Publisher[];

  if (!publisher) notFound();

  const provincesList = await db.select().from(provinces);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Publisher</h1>
      <PublisherForm publisher={publisher} provinces={provincesList} action={updatePublisher} />
    </div>
  );
}
