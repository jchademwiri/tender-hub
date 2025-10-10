import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import ProvinceForm from '@/components/ProvinceForm';
import { notFound } from 'next/navigation';

async function updateProvince(prevState: any, formData: FormData) {
  'use server';

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const description = formData.get('description') as string;

  try {
    await db.update(provinces).set({ name, code, description }).where(eq(provinces.id, id));
    redirect('/admin/provinces');
  } catch (error) {
    return { error: 'Failed to update province' };
  }
}

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