'use client';

import { useActionState } from 'react';
import { Publisher, Province } from '@/db/schema';

interface PublisherFormProps {
  publisher?: Publisher;
  provinces: Province[];
  action: (prevState: any, formData: FormData) => Promise<any>;
}

export default function PublisherForm({ publisher, provinces, action }: PublisherFormProps) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={publisher?.name || ''}
          required
          className="mt-1 block w-full border border-input bg-background rounded px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="website" className="block text-sm font-medium">Website</label>
        <input
          id="website"
          name="website"
          type="url"
          defaultValue={publisher?.website || ''}
          className="mt-1 block w-full border border-input bg-background rounded px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="province_id" className="block text-sm font-medium">Province</label>
        <select
          id="province_id"
          name="province_id"
          defaultValue={publisher?.province_id || ''}
          required
          className="mt-1 block w-full border border-input bg-background rounded px-3 py-2"
        >
          <option value="">Select Province</option>
          {provinces.map((prov) => (
            <option key={prov.id} value={prov.id}>
              {prov.name}
            </option>
          ))}
        </select>
      </div>
      {publisher && <input type="hidden" name="id" value={publisher.id} />}
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer">
        {publisher ? 'Update' : 'Create'} Publisher
      </button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}