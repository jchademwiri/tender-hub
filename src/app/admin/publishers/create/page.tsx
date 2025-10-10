import { db } from '@/db';
import { provinces, publishers } from '@/db/schema';
import { redirect } from 'next/navigation';
import PublisherForm from '@/components/PublisherForm';

async function createPublisher(prevState: any, formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const website = formData.get('website') as string;
  const province_id = formData.get('province_id') as string;

  try {
    await db.insert(publishers).values({ name, website: website || null, province_id });
    redirect('/admin/publishers');
  } catch (error) {
    return { error: 'Failed to create publisher' };
  }
}

export default async function CreatePublisher() {
  const provincesList = await db.select().from(provinces);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Create Publisher</h1>
      <PublisherForm provinces={provincesList} action={createPublisher} />
    </div>
  );
}