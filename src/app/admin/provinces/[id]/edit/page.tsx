import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProvinceForm from '@/components/ProvinceForm';
import { notFound } from 'next/navigation';
import { updateProvince } from '@/server';

interface PageProps {
  params: { id: string };
}

export default async function EditProvince({ params }: PageProps) {
  const [province] = await db.select().from(provinces).where(eq(provinces.id, params.id));

  if (!province) notFound();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Province</h1>
      <ProvinceForm province={province} action={updateProvince} />
    </div>
  );
}