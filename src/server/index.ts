'use server';

import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
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

export async function deleteProvince(id: string) {
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