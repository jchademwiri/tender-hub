import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface InvitePageProps {
  params: Promise<{ code: string }>
}

export default async function InviteAcceptancePage({ params }: InvitePageProps) {
  const { code } = await params

  // TODO: Implement invitation validation
  // - Check if invitation code exists in database
  // - Verify invitation is not expired and not already accepted
  // - Fetch invitation details: email, role, expiresAt

  // TODO: Implement sign-up form logic
  // - Pre-fill email from invitation
  // - Validate form: name, password, confirm password
  // - On submit: Create user account with Better Auth
  // - Mark invitation as accepted
  // - Redirect to login or dashboard

  // TODO: Handle invalid invitation
  // - If code invalid/expired, show error message
  // - Provide option to contact admin for new invitation

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accept Invitation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to join Tender Hub
          </p>
        </div>
        <form className="mt-8 space-y-6">
          {/* TODO: Conditionally render based on invitation validity */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value="TODO: Pre-fill from invitation"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
          <div>
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </div>
        </form>
        {/* TODO: Add error/success message display */}
        <div className="mt-4 p-4 bg-muted rounded">
          <p>TODO: Implement invitation acceptance logic</p>
          <p>Invitation Code: {code}</p>
          <p>Features needed:</p>
          <ul className="list-disc list-inside">
            <li>Validate invitation code</li>
            <li>Handle sign-up with Better Auth</li>
            <li>Mark invitation as accepted</li>
            <li>Redirect after successful registration</li>
          </ul>
        </div>
        <div className="text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}