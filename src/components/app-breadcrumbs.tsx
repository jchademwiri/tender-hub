"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbConfig {
  [key: string]: {
    label: string
    href?: string
  }
}

const breadcrumbConfig: BreadcrumbConfig = {
  "/": { label: "Home" },
  "/dashboard": { label: "Dashboard" },
  "/admin": { label: "Admin" },
  "/admin/users": { label: "Users" },
  "/admin/invitations": { label: "Invitations" },
  "/admin/analytics": { label: "Analytics" },
  "/admin/system": { label: "System" },
  "/manager": { label: "Manager" },
  "/manager/approvals": { label: "Approvals" },
  "/manager/reports": { label: "Reports" },
  "/manager/team": { label: "Team" },
  "/publishers": { label: "Publishers" },
  "/profile": { label: "Profile" },
}

export function AppBreadcrumbs() {
  const pathname = usePathname()

  // Generate breadcrumb items from the current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []

    // Add home breadcrumb
    breadcrumbs.push({
      label: "Home",
      href: "/",
      isLast: pathSegments.length === 0
    })

    // Build path incrementally and add each segment
    let currentPath = ""
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const config = breadcrumbConfig[currentPath]
      const isLast = index === pathSegments.length - 1

      breadcrumbs.push({
        label: config?.label || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
        isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href || breadcrumb.label} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {breadcrumb.isLast ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={breadcrumb.href!}>
                  {breadcrumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}