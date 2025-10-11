import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminUsersPage() {
  // TODO: Implement user fetching logic
  // - Fetch all users from database with pagination
  // - Include user details: id, name, email, role, banned status, createdAt
  // - Add search/filter functionality by email, role, status
  // - Restrict access to admin/owner roles only

  // TODO: Implement user actions
  // - Edit role (dropdown for role selection)
  // - Ban/unban user (with reason and expiration)
  // - Delete user (soft delete if needed)
  // - View user details

  // TODO: Add table component for displaying users
  // - Columns: Name, Email, Role, Status, Actions
  // - Use existing Table component from ui

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Button asChild>
            <Link href="/admin/users/invite">Invite User</Link>
          </Button>
        </div>
        {/* TODO: Replace with actual user table */}
        <div className="bg-muted p-4 rounded">
          <p>TODO: Implement user list table here</p>
          <p>Features needed:</p>
          <ul className="list-disc list-inside">
            <li>Display users with name, email, role, status</li>
            <li>Search and filter options</li>
            <li>Action buttons for edit, ban, delete</li>
            <li>Pagination for large user lists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}