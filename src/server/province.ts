'use server';

import { db } from '@/db';
import { provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function deleteProvince(formData: FormData) {
  const id = formData.get('id') as string;
  
  try {
    await db.delete(provinces).where(eq(provinces.id, id));
  } catch (error) {
    console.error('Failed to delete province:', error);
    throw error;
  }
  
  redirect('/admin/provinces');
}

export async function createProvince(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const description = formData.get('description') as string;

  try {
    await db.insert(provinces).values({ name, code, description });
  } catch (error) {
    console.error('Failed to create province:', error);
    return { error: 'Failed to create province' };
  }
  
  // Redirect OUTSIDE the try-catch
  redirect('/admin/provinces');
}

export async function updateProvince(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const description = formData.get('description') as string;

  try {
    await db.update(provinces)
      .set({ name, code, description })
      .where(eq(provinces.id, id));
  } catch (error) {
    console.error('Failed to update province:', error);
    return { error: 'Failed to update province' };
  }
  
  // Redirect OUTSIDE the try-catch
  redirect('/admin/provinces');
}