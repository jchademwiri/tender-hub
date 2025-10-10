'use client';

import { useActionState } from 'react';
import { Province } from '@/db/schema';

interface ProvinceFormProps {
  province?: Province;
  action: (prevState: any, formData: FormData) => Promise<any>;
}

export default function ProvinceForm({ province, action }: ProvinceFormProps) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={province?.name || ''}
          required
          className="mt-1 block w-full border border-input bg-background rounded px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="code" className="block text-sm font-medium">Code</label>
        <input
          id="code"
          name="code"
          type="text"
          defaultValue={province?.code || ''}
          required
          className="mt-1 block w-full border border-input bg-background rounded px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea
          id="description"
          name="description"
          defaultValue={province?.description || ''}
          className="mt-1 block w-full border border-input bg-background rounded px-3 py-2"
        />
      </div>
      {province && <input type="hidden" name="id" value={province.id} />}
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer">
        {province ? 'Update' : 'Create'} Province
      </button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}