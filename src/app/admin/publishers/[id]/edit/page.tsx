import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import PublisherForm from '@/components/PublisherForm';
import { notFound } from 'next/navigation';

async function updatePublisher(prevState: any, formData: FormData) {
  'use server';

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const website = formData.get('website') as string;
  const province_id = formData.get('province_id') as string;

  try {
    await db.update(publishers).set({ name, website: website || null, province_id }).where(eq(publishers.id, id));
    redirect('/admin/publishers');
  } catch (error) {
    return { error: 'Failed to update publisher' };
  }
}

interface PageProps {
  params: { id: string };
}

export default async function EditPublisher({ params }: PageProps) {
  const [publisher] = await db
    .select({
      id: publishers.id,
      name: publishers.name,
      website: publishers.website,
      province_id: publishers.province_id,
      createdAt: publishers.createdAt,
      province: provinces,
    })
    .from(publishers)
    .leftJoin(provinces, eq(publishers.province_id, provinces.id))
    .where(eq(publishers.id, params.id));

  if (!publisher) notFound();

  const provincesList = await db.select().from(provinces);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Publisher</h1>
      <PublisherForm publisher={publisher} provinces={provincesList} action={updatePublisher} />
    </div>
  );
}