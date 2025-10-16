"use client"

import React, { useState, useMemo, useCallback, memo } from 'react';
import { db } from '@/db';
import { publishers, provinces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import Table from '@/components/Table';
import { PublisherVisitBadge } from '@/components/publisher-visit-badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Publisher {
  id: string;
  name: string;
  website: string | null;
  province_id: string | null;
  createdAt: Date;
  provinceName: string | null;
}

type SortField = 'name' | 'website' | 'provinceName' | 'visits' | 'lastVisit';
type SortDirection = 'asc' | 'desc';

const PublishersPage = memo(() => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Memoize mock data to prevent recreation on every render
  const data: Publisher[] = useMemo(() => [
    {
      id: '1',
      name: 'Gauteng Provincial Government',
      website: 'https://www.gauteng.gov.za',
      province_id: 'gp',
      createdAt: new Date('2024-01-15'),
      provinceName: 'Gauteng'
    },
    {
      id: '2',
      name: 'Western Cape Government',
      website: 'https://www.westerncape.gov.za',
      province_id: 'wc',
      createdAt: new Date('2024-01-20'),
      provinceName: 'Western Cape'
    },
    {
      id: '3',
      name: 'KwaZulu-Natal Provincial Government',
      website: 'https://www.kzn.gov.za',
      province_id: 'kzn',
      createdAt: new Date('2024-02-01'),
      provinceName: 'KwaZulu-Natal'
    }
  ], []);

  // Sort data based on current sort settings
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'website':
          aValue = a.website || '';
          bValue = b.website || '';
          break;
        case 'provinceName':
          aValue = a.provinceName || '';
          bValue = b.provinceName || '';
          break;
        case 'visits':
          // Mock visit count - in real implementation, this would come from visit tracking
          aValue = Math.floor(Math.random() * 10);
          bValue = Math.floor(Math.random() * 10);
          break;
        case 'lastVisit':
          // Mock last visit - in real implementation, this would come from visit tracking
          aValue = Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000) : null;
          bValue = Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000) : null;
          break;
        default:
          return 0;
      }

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  // Memoize sort handler to prevent unnecessary re-renders
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Memoize sort button component to prevent recreation on every render
  const SortButton = useMemo(() =>
    memo(({ field, children }: { field: SortField; children: React.ReactNode }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-semibold hover:bg-transparent"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {sortField === field ? (
            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          )}
        </div>
      </Button>
    )), [handleSort, sortField, sortDirection]
  );

  SortButton.displayName = 'SortButton';

  // Memoize column definitions to prevent recreation on every render
  const columns = useMemo(() => [
    {
      key: 'name',
      header: <SortButton field="name">Publisher</SortButton>,
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
      header: <SortButton field="website">Website</SortButton>,
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
      header: <SortButton field="provinceName">Province</SortButton>
    },
    {
      key: 'visits',
      header: <SortButton field="visits">Visits</SortButton>,
      render: (_: any, item: Publisher) => (
        <PublisherVisitBadge
          publisherId={item.id}
          publisherName={item.name}
          size="sm"
          showDetails={true}
        />
      )
    },
    {
      key: 'lastVisit',
      header: <SortButton field="lastVisit">Last Visit</SortButton>,
      render: (_: any, item: Publisher) => {
        // Mock last visit time - in real implementation, this would come from visit tracking
        const hasVisits = Math.random() > 0.3;
        if (!hasVisits) return <span className="text-muted-foreground">Never</span>;

        const lastVisit = new Date(Date.now() - Math.random() * 7 * 86400000); // Random last 7 days
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60));

        let timeAgo: string;
        if (diffInHours < 1) {
          timeAgo = 'Just now';
        } else if (diffInHours < 24) {
          timeAgo = `${diffInHours}h ago`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          timeAgo = `${diffInDays}d ago`;
        }

        return (
          <span className="text-sm text-muted-foreground">
            {timeAgo}
          </span>
        );
      }
    }
  ], [SortButton]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tender Publishers</h1>
      <Table
        data={sortedData}
        columns={columns}
        actions={() => null} // No actions for users
      />
      <div className="mt-6">
        <Link href="/" className="px-4 py-2 bg-secondary text-secondary-foreground rounded cursor-pointer">
          Back to Home
        </Link>
      </div>
    </div>
  );
});

PublishersPage.displayName = 'PublishersPage';

export default PublishersPage;