import { sendEmail } from "@/lib/email";
import { checkPermission } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { invitationTracking, invitationTrackingUtils } from "@/lib/invitation-tracking";

export async function createInvitation({
  email,
  role,
  invitedBy,
}: {
  email: string;
  role: "admin" | "manager" | "user";
  invitedBy: string;
}) {
  try {
    // Get current session to verify user exists and get their info
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized: No valid session");
    }

    // Verify the inviter exists and has permission by checking database directly
    const { db } = await import("@/db");
    const { user } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const inviterUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        image: user.image,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        status: user.status,
        invitedBy: user.invitedBy,
        invitedAt: user.invitedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, invitedBy))
      .limit(1);

    if (inviterUsers.length === 0) {
      throw new Error("Inviter not found");
    }

    const inviter = inviterUsers[0];

    // Check permissions
    const permissions = checkPermission(inviter);

    if (!permissions.canInviteUsers()) {
      throw new Error("Insufficient permissions to invite users");
    }

    if (role === "admin" && !permissions.canInviteAdmin()) {
      throw new Error("Only admins can invite other admins");
    }

    if (role === "manager" && !permissions.canInviteManager()) {
      throw new Error("Only admins can invite managers");
    }

    // Create invitation via API
    const invitationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role,
        sendEmail: false // We'll handle email sending manually
      }),
    });

    if (!invitationResponse.ok) {
      const errorData = await invitationResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create invitation: ${invitationResponse.statusText}`);
    }

    const invitationData = await invitationResponse.json();
    const newInvitation = invitationData.invitation;

    if (!newInvitation) {
      throw new Error("Failed to create invitation - no invitation returned");
    }

    // Send invitation email manually (since we disabled auto-send)
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${newInvitation.id}`;

    await sendEmail({
      to: email,
      subject: `You've been invited to Tender Hub`,
      html: `
        <h1>Welcome to Tender Hub!</h1>
        <p>${inviter.name} has invited you to join as a <strong>${role}</strong>.</p>
        <p>Click the link below to accept your invitation and create your account:</p>
        <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
        <p>This invitation expires in 7 days.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
    });

    // Track the invitation as sent
    try {
      await invitationTracking.trackSent({
        invitationId: newInvitation.id,
        email,
        role,
        inviterId: invitedBy,
        metadata: invitationTrackingUtils.generateMetadata({
          emailSubject: `You've been invited to Tender Hub`,
          emailTemplate: "default-invitation",
          invitationUrl,
          expiresAt: newInvitation.expiresAt
        })
      });
    } catch (trackingError) {
      console.error("Failed to track invitation sent event:", trackingError);
      // Don't fail the invitation creation if tracking fails
    }

    return newInvitation;
  } catch (error) {
    // Re-throw with original message if it's already a proper error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to create invitation: ${error}`);
  }
}

export async function acceptInvitation({
  invitationId,
  password,
  name,
}: {
  invitationId: string;
  password: string;
  name: string;
}) {
  try {
    console.log("🔍 DEBUG: Starting invitation acceptance for ID:", invitationId);

    // Get invitation details from database directly
    const { db } = await import("@/db");
    const { invitation, user } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const inviteResults = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        inviterId: invitation.inviterId,
      })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    console.log("🔍 DEBUG: Invitation query results:", inviteResults);

    if (inviteResults.length === 0) {
      console.log("❌ DEBUG: No invitation found for ID:", invitationId);
      throw new Error("Invalid invitation ID");
    }

    const invite = inviteResults[0];
    console.log("🔍 DEBUG: Invitation details:", {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt
    });

    if (invite.status !== "pending") {
      console.log("❌ DEBUG: Invitation status is not pending:", invite.status);
      throw new Error("Invitation already used or cancelled");
    }

    if (new Date() > new Date(invite.expiresAt)) {
      console.log("❌ DEBUG: Invitation expired:", invite.expiresAt);
      // Mark as expired in database
      await db
        .update(invitation)
        .set({
          status: "expired",
          expiredAt: new Date(),
        })
        .where(eq(invitation.id, invitationId));

      throw new Error("Invitation expired");
    }

    console.log("✅ DEBUG: Invitation is valid, proceeding with user creation");

    // Check if user already exists
    const existingUser = await db
      .select({ id: user.id, email: user.email, role: user.role, status: user.status })
      .from(user)
      .where(eq(user.email, invite.email))
      .limit(1);

    console.log("🔍 DEBUG: Existing user check:", existingUser);

    if (existingUser.length > 0) {
      console.log("⚠️ DEBUG: User already exists:", existingUser[0]);
      // Mark invitation as accepted anyway
      await db
        .update(invitation)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(invitation.id, invitationId));

      return {
        success: true,
        redirectTo: `/sign-in?message=invitation-accepted&email=${encodeURIComponent(invite.email)}&info=account-exists`
      };
    }

    console.log("🔍 DEBUG: No existing user found, creating new user account");

    // Create user account using Better Auth's signUp method
    const { auth } = await import("@/lib/auth");

    try {
      console.log("🔍 DEBUG: Attempting to create user via Better Auth signUp");
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: invite.email,
          password: password,
          name: name,
        },
        headers: new Headers(), // Empty headers for server-side call
      });

      console.log("🔍 DEBUG: Better Auth signUp result:", signUpResult);

      // Better Auth returns user object on success, or throws error on failure
      if (!signUpResult.user) {
        console.log("❌ DEBUG: Better Auth signUp failed - no user returned");
        throw new Error("User creation failed: No user returned from signUp");
      }

      console.log("✅ DEBUG: User created successfully via Better Auth:", signUpResult.user.id);

      // Update the user with role and status (since Better Auth doesn't handle custom fields in signUp)
      await db
        .update(user)
        .set({
          role: (invite.role as "owner" | "admin" | "manager" | "user") || "user",
          status: "active" as const,
          emailVerified: true, // Skip verification for invited users
          invitedBy: invite.inviterId,
          invitedAt: new Date(),
        })
        .where(eq(user.id, signUpResult.user.id));

      console.log("✅ DEBUG: User role and status updated");

      // Mark invitation as accepted
      await db
        .update(invitation)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(invitation.id, invitationId));

      console.log("✅ DEBUG: Invitation marked as accepted");

      return {
        success: true,
        redirectTo: `/sign-in?message=invitation-accepted&email=${encodeURIComponent(invite.email)}&info=account-created`
      };

    } catch (signUpError: any) {
      console.log("❌ DEBUG: Better Auth signUp exception:", signUpError);
      // Better Auth throws errors directly, so we need to handle them
      if (signUpError.message) {
        throw new Error(`User creation failed: ${signUpError.message}`);
      }
      throw signUpError;
    }

  } catch (error) {
    console.log("❌ DEBUG: acceptInvitation error:", error);
    // Re-throw with original message if it's already a proper error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to accept invitation: ${error}`);
  }
}

export async function resendInvitation(invitationId: string, requesterId: string) {
  try {
    // Get invitation details via API
    const invitationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!invitationResponse.ok) {
      throw new Error("Failed to fetch invitation details");
    }

    const invitationsData = await invitationResponse.json();
    const invite = invitationsData.invitations?.find((inv: any) => inv.id === invitationId);

    if (!invite) {
      throw new Error("Invitation not found");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only resend pending invitations");
    }

    // Verify requester permissions
    const requesterResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!requesterResponse.ok) {
      throw new Error("Failed to verify requester permissions");
    }

    const requesterData = await requesterResponse.json();
    const requester = requesterData.users?.find((u: any) => u.id === requesterId);

    if (!requester) {
      throw new Error("Requester not found");
    }

    const permissions = checkPermission(requester);
    if (!permissions.canInviteUsers()) {
      throw new Error("Insufficient permissions");
    }

    // Resend invitation via API
    const resendResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations/${invitationId}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to resend invitation");
    }

    return { success: true };
  } catch (error) {
    // Re-throw with original message if it's already a proper error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to resend invitation: ${error}`);
  }
}

export async function cancelInvitation(invitationId: string, requesterId: string) {
  try {
    // Get invitation details via API
    const invitationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!invitationResponse.ok) {
      throw new Error("Failed to fetch invitation details");
    }

    const invitationsData = await invitationResponse.json();
    const invite = invitationsData.invitations?.find((inv: any) => inv.id === invitationId);

    if (!invite) {
      throw new Error("Invitation not found");
    }

    // Verify requester permissions
    const requesterResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!requesterResponse.ok) {
      throw new Error("Failed to verify requester permissions");
    }

    const requesterData = await requesterResponse.json();
    const requester = requesterData.users?.find((u: any) => u.id === requesterId);

    if (!requester) {
      throw new Error("Requester not found");
    }

    if (invite.inviterId !== requesterId && requester.role !== "admin") {
      throw new Error("Only the inviter or an admin can cancel this invitation");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only cancel pending invitations");
    }

    // Cancel invitation via API
    const cancelResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations/${invitationId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to cancel invitation");
    }

    return { success: true };
  } catch (error) {
    // Re-throw with original message if it's already a proper error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to cancel invitation: ${error}`);
  }
}