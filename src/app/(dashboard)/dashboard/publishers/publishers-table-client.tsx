"use client";

import { ArrowUpDown, Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PublisherVisitBadge } from "@/components/publisher-visit-badge";
import Table from "@/components/Table";
import { toast } from "sonner";

interface Publisher {
  id: string;
  name: string;
  website: string | null;
  isBookmarked?: boolean;
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

  const handleBookmarkToggle = async (publisherId: string) => {
    try {
      console.log("Toggling bookmark for publisher:", publisherId);
      const response = await fetch(`/api/user/bookmarks/${publisherId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Response result:", result);
        toast.success(result.bookmarked ? "Added to bookmarks" : "Removed from bookmarks");

        // Refresh the page to update the data
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        toast.error(errorData.error || "Failed to toggle bookmark");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Error toggling bookmark");
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
      key: "bookmark",
      header: "Bookmark",
      render: (_value: any, item: Publisher) => (
        <button
          onClick={() => handleBookmarkToggle(item.id)}
          className="p-1 hover:bg-muted rounded transition-colors"
          title={item.isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
        >
          {item.isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-primary" />
          ) : (
            <Bookmark className="w-4 h-4 text-muted-foreground hover:text-primary" />
          )}
        </button>
      ),
    },
  ];

  return <Table data={sortedPublishers} columns={columns} />;
}
