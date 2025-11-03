"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbConfig {
  label: string;
  href?: string;
}

const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  "/": { label: "Dashboard" },
  "/admin": { label: "Admin" },
  "/admin/audit-logs": { label: "Audit Logs" },
  "/admin/users": { label: "Users" },
  "/admin/invitations": { label: "Invitations" },
  "/admin/database": { label: "Database" },
  "/admin/performance": { label: "Performance" },
  "/admin/settings": { label: "Settings" },
  "/manager": { label: "Manager" },
  "/manager/approvals": { label: "Approvals" },
  "/team": { label: "Team" },
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbConfig[] = [];

    // Always start with Dashboard
    breadcrumbs.push({ label: "Dashboard", href: "/" });

    // Build breadcrumbs for each segment
    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      
      // Get the label for this path
      const config = breadcrumbConfig[currentPath];
      if (config) {
        breadcrumbs.push({
          label: config.label,
          href: currentPath,
        });
      } else {
        // If no config found, use the segment with proper formatting
        const label = segment
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        breadcrumbs.push({
          label,
          href: currentPath,
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const isLastItem = (index: number) => index === breadcrumbs.length - 1;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const isFirstItem = index === 0;
          const isLastBreadcrumb = isLastItem(index);
          
          return (
            <div key={item.href || index} className="flex items-center">
              <BreadcrumbItem className={!isFirstItem && !isLastBreadcrumb ? "hidden md:block" : ""}>
                {isLastBreadcrumb ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href!}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLastBreadcrumb && (
                <BreadcrumbSeparator className={!isFirstItem ? "hidden md:block" : ""} />
              )}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}