'use server';

import { db } from '@/db';
import { publishers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function deletePublisher(id: string) {
  await db.delete(publishers).where(eq(publishers.id, id));
}

export async function updatePublisher(prevState: any, formData: FormData) {
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

export async function createPublisher(prevState: any, formData: FormData) {
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