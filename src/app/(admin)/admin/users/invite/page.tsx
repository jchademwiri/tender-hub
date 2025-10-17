import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AdminInviteUserPage() {
  // TODO: Implement invitation form logic
  // - Form validation: email required, unique check, role selection
  // - On submit: Create invitation record in database
  // - Generate secure invitation code/token
  // - Send email with invitation link to /invite/[code]
  // - Handle success/error states
  // - Restrict to admin/owner roles

  // TODO: Add form submission handler
  // - Use server action or API route for invitation creation
  // - Integrate with email service (e.g., Resend) for sending invites

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
                <BreadcrumbLink asChild>
                  <Link href="/admin/users">Users</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Invite User</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-3xl font-bold">Invite New User</h1>
        <div className="max-w-md">
          <form className="space-y-4">
            {/* TODO: Add form fields with proper validation */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
              />
              {/* TODO: Add email validation and uniqueness check */}
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {/* TODO: Conditionally show 'owner' only if current user is owner */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Optional Message</Label>
              <Textarea
                id="message"
                placeholder="Personal message to include in the invitation email"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              Send Invitation
            </Button>
          </form>
          {/* TODO: Add success/error message display - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-muted rounded">
              <p>TODO: Implement form submission</p>
              <p>Features needed:</p>
              <ul className="list-disc list-inside">
                <li>Validate email and role</li>
                <li>Create invitation record</li>
                <li>Send invitation email</li>
                <li>Handle loading and error states</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}