import React from 'react';
import { getAllPublishers } from '@/server/publisher';
import Link from 'next/link';
import { PublishersTableClient } from './publishers-table-client';

export default async function PublishersPage() {
  const publishers = await getAllPublishers();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tender Publishers</h1>
      <PublishersTableClient publishers={publishers} />
      <div className="mt-6">
        <Link href="/" className="px-4 py-2 bg-secondary text-secondary-foreground rounded cursor-pointer">
          Back to Home
        </Link>
      </div>
    </div>
  );
}