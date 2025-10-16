"use client"

import React from 'react';
import Link from 'next/link';
import Table from '@/components/Table';
import { PublisherVisitBadge } from '@/components/publisher-visit-badge';
import { ArrowUpDown } from 'lucide-react';

interface Publisher {
  id: string;
  name: string;
  website: string | null;
  province_id: string | null;
  createdAt: Date;
  provinceName: string | null;
}

interface PublishersTableClientProps {
  publishers: Publisher[];
}

export function PublishersTableClient({ publishers }: PublishersTableClientProps) {
  const columns = [
    {
      key: 'name',
      header: (
        <div className="flex items-center gap-1">
          Publisher
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </div>
      ),
      render: (value: string, item: Publisher) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/publishers/${item.id}`}
            className="text-primary hover:underline font-medium"
          >
            {value}
          </Link>
          <PublisherVisitBadge
            publisherId={item.id}
            publisherName={item.name}
            size="sm"
          />
        </div>
      )
    },
    {
      key: 'website',
      header: (
        <div className="flex items-center gap-1">
          Website
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </div>
      ),
      render: (value: string | null) => value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {value}
        </a>
      ) : 'N/A'
    },
    {
      key: 'provinceName',
      header: (
        <div className="flex items-center gap-1">
          Province
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </div>
      ),
      render: (value: string | null) => value || 'N/A'
    },
    {
      key: 'visits',
      header: (
        <div className="flex items-center gap-1">
          Visits
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </div>
      ),
      render: (_: any, item: Publisher) => (
        <PublisherVisitBadge
          publisherId={item.id}
          publisherName={item.name}
          size="sm"
          showDetails={true}
        />
      )
    }
  ];

  return (
    <Table
      data={publishers}
      columns={columns}
    />
  );
}