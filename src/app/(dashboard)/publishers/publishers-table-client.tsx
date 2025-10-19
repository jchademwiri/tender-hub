"use client";

import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PublisherVisitBadge } from "@/components/publisher-visit-badge";
import Table from "@/components/Table";

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

type SortKey = keyof Publisher;
type SortDirection = "asc" | "desc";

export function PublishersTableClient({
  publishers,
}: PublishersTableClientProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedPublishers = useMemo(() => {
    return [...publishers].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Handle null values
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // Handle string comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Handle date comparison
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === "asc"
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      return 0;
    });
  }, [publishers, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const validateAndRenderUrl = (url: string | null) => {
    if (!url) return "N/A";

    try {
      // Handle relative URLs by prefixing with https://
      const normalizedUrl =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;

      const urlObj = new URL(normalizedUrl);

      // Only allow http and https protocols
      if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
        return (
          <a
            href={urlObj.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            {url}
          </a>
        );
      }

      return "N/A";
    } catch {
      return "N/A";
    }
  };

  const columns = [
    {
      key: "name",
      header: (
        <button
          onClick={() => handleSort("name")}
          className="flex items-center gap-1 hover:bg-muted/50 px-1 py-0.5 rounded transition-colors"
        >
          Publisher
          <ArrowUpDown
            className={`w-3 h-3 transition-opacity ${
              sortKey === "name" ? "opacity-100" : "opacity-50"
            }`}
          />
        </button>
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
      ),
    },
    {
      key: "website",
      header: (
        <button
          onClick={() => handleSort("website")}
          className="flex items-center gap-1 hover:bg-muted/50 px-1 py-0.5 rounded transition-colors"
        >
          Website
          <ArrowUpDown
            className={`w-3 h-3 transition-opacity ${
              sortKey === "website" ? "opacity-100" : "opacity-50"
            }`}
          />
        </button>
      ),
      render: (value: string | null) => validateAndRenderUrl(value),
    },
    {
      key: "provinceName",
      header: (
        <button
          onClick={() => handleSort("provinceName")}
          className="flex items-center gap-1 hover:bg-muted/50 px-1 py-0.5 rounded transition-colors"
        >
          Province
          <ArrowUpDown
            className={`w-3 h-3 transition-opacity ${
              sortKey === "provinceName" ? "opacity-100" : "opacity-50"
            }`}
          />
        </button>
      ),
      render: (value: string | null) => value || "N/A",
    },
    {
      key: "createdAt",
      header: (
        <button
          onClick={() => handleSort("createdAt")}
          className="flex items-center gap-1 hover:bg-muted/50 px-1 py-0.5 rounded transition-colors"
        >
          Created
          <ArrowUpDown
            className={`w-3 h-3 transition-opacity ${
              sortKey === "createdAt" ? "opacity-100" : "opacity-50"
            }`}
          />
        </button>
      ),
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
  ];

  return <Table data={sortedPublishers} columns={columns} />;
}
