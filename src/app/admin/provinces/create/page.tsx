import { db } from '@/db';
import { provinces } from '@/db/schema';
import { redirect } from 'next/navigation';
import ProvinceForm from '@/components/ProvinceForm';

async function createProvince(prevState: any, formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const description = formData.get('description') as string;

  try {
    await db.insert(provinces).values({ name, code, description });
    redirect('/admin/provinces');
  } catch (error) {
    return { error: 'Failed to create province' };
  }
}

export default function CreateProvince() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Create Province</h1>
      <ProvinceForm action={createProvince} />
    </div>
  );
}