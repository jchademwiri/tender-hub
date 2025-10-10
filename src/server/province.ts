'use server';

import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function deleteProvince(formData: FormData) {
  const id = formData.get('id') as string;
  await db.delete(provinces).where(eq(provinces.id, id));
}

export async function createProvince(prevState: any, formData: FormData) {
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

export async function updateProvince(prevState: any, formData: FormData) {
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