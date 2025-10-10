import { db } from '@/db';
import { provinces, publishers } from '@/db/schema';
import PublisherForm from '@/components/PublisherForm';
import { createPublisher } from '@/server';

export default async function CreatePublisher() {
  const provincesList = await db.select().from(provinces);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Create Publisher</h1>
      <PublisherForm provinces={provincesList} action={createPublisher} />
    </div>
  );
}