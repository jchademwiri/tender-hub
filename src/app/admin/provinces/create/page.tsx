import { db } from '@/db';
import { provinces } from '@/db/schema';
import ProvinceForm from '@/components/ProvinceForm';
import { createProvince } from '@/server';

export default function CreateProvince() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Create Province</h1>
      <ProvinceForm action={createProvince} />
    </div>
  );
}