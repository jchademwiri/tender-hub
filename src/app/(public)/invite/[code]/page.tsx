import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle, AlertCircle, Users, Shield, Settings } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { invitation, user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { acceptInvitation } from "@/lib/invitation"
import { authValidationHelpers, authErrorMessages } from "@/lib/validations/auth"
import { InvitationForm } from "./invitation-form"

// Types for invitation details
interface InvitationDetails {
  id: string
  email: string
  role: string | null
  status: string
  expiresAt: Date
  inviterName?: string | null
  inviterEmail?: string | null
}

// Server action for fetching invitation details
async function getInvitationDetails(code: string): Promise<InvitationDetails | null> {
  'use server'

  try {
    const invite = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        inviterName: user.name,
        inviterEmail: user.email,
      })
      .from(invitation)
      .leftJoin(user, eq(invitation.inviterId, user.id))
      .where(eq(invitation.id, code))
      .limit(1)

    if (!invite[0]) {
      return null
    }

    return {
      ...invite[0],
      expiresAt: invite[0].expiresAt,
    }
  } catch (error) {
    console.error('Error fetching invitation details:', error)
    return null
  }
}

// Server action for handling form submission
async function handleInviteAcceptance(prevState: any, formData: FormData): Promise<{ error: string } | { success: boolean; message: string; redirectTo: string }> {
  'use server'

  const name = formData.get('name') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const invitationId = formData.get('invitationId') as string

  // Basic validation
  if (!name || !password || !confirmPassword || !invitationId) {
    return { error: 'All fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 12) {
    return { error: 'Password must be at least 12 characters long' }
  }

  try {
    // Use the existing acceptInvitation function
    const result = await acceptInvitation({
      invitationId,
      password,
      name,
    })

    // Return success response instead of redirecting
    if (result.success) {
      return {
        success: true,
        message: 'Invitation accepted successfully',
        redirectTo: result.redirectTo || '/?message=invitation-accepted'
      }
    } else {
      return { error: 'Failed to accept invitation' }
    }
  } catch (error) {
    // Return error message for display
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { error: errorMessage }
  }
}

// Helper function to get role display information
function getRoleDisplayInfo(role: string | null) {
  switch (role) {
    case 'admin':
      return {
        name: 'Administrator',
        description: 'Full system access with user management capabilities',
        icon: Shield,
        color: 'bg-red-100 text-red-800',
        permissions: ['Manage users', 'Manage invitations', 'Access all data', 'System configuration']
      }
    case 'manager':
      return {
        name: 'Manager',
        description: 'Team management and reporting access',
        icon: Settings,
        color: 'bg-blue-100 text-blue-800',
        permissions: ['Manage team members', 'View reports', 'Approve requests', 'Access team data']
      }
    case 'user':
      return {
        name: 'User',
        description: 'Standard user access with basic functionality',
        icon: Users,
        color: 'bg-green-100 text-green-800',
        permissions: ['View assigned data', 'Submit reports', 'Basic system access']
      }
    default:
      return {
        name: 'Unknown Role',
        description: 'Role information not available',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-800',
        permissions: []
      }
  }
}

// Helper function to check if invitation is expired
function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

interface InvitePageProps {
  params: Promise<{ code: string }>
}

export default async function InviteAcceptancePage({ params }: InvitePageProps) {
  const { code } = await params

  // Fetch invitation details
  const invitationDetails = await getInvitationDetails(code)

  // Handle invalid invitation
  if (!invitationDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has been cancelled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center mb-4">
              Please contact your administrator to request a new invitation.
            </p>
            <div className="text-center">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle expired invitation
  if (invitationDetails.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle className="text-yellow-900">Invitation Already Used</CardTitle>
            <CardDescription>
              This invitation has already been accepted or cancelled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center mb-4">
              If you believe this is an error, please contact your administrator.
            </p>
            <div className="text-center">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle expired invitation
  if (isInvitationExpired(invitationDetails.expiresAt)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-orange-900">Invitation Expired</CardTitle>
            <CardDescription>
              This invitation expired on {invitationDetails.expiresAt.toLocaleDateString()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center mb-4">
              Please contact your administrator to request a new invitation.
            </p>
            <div className="text-center">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid invitation - show acceptance form
  const roleInfo = getRoleDisplayInfo(invitationDetails.role)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Invitation Details Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Welcome to Tender Hub</CardTitle>
            <CardDescription>
              You've been invited to join as a {roleInfo.name.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Badge */}
            <div className="flex justify-center">
              <Badge className={`${roleInfo.color} flex items-center gap-1`}>
                <roleInfo.icon className="w-3 h-3" />
                {roleInfo.name}
              </Badge>
            </div>

            {/* Invitation Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{invitationDetails.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className="font-medium">
                  {invitationDetails.expiresAt.toLocaleDateString()}
                </span>
              </div>
              {invitationDetails.inviterName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Invited by:</span>
                  <span className="font-medium">{invitationDetails.inviterName}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Role Description */}
            <div>
              <h4 className="font-medium text-sm mb-2">Role Overview:</h4>
              <p className="text-sm text-gray-600 mb-3">{roleInfo.description}</p>

              <div className="space-y-1">
                <h5 className="font-medium text-xs text-gray-700 uppercase tracking-wide">Permissions:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {roleInfo.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Please provide your details to complete the registration process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationForm
              invitationId={invitationDetails.id}
              email={invitationDetails.email}
              action={handleInviteAcceptance}
            />
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}