import React from 'react';
import { getAllPublishers } from '@/server/publisher';
import Link from 'next/link';
import { PublishersTableClient } from './publishers-table-client';

export default async function PublishersPage() {
  const publishers = await getAllPublishers();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="w-full max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Tender Publishers</h1>
          <div className="bg-card rounded-lg border shadow-sm">
            <PublishersTableClient publishers={publishers} />
          </div>
          <div className="mt-6">
            <Link
              href="/"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
    </div>
  );
}