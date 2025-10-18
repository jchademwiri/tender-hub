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
    const session = await auth.api.getSession({
      headers: new Headers()
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized: No valid session");
    }

    // Verify the inviter exists and has permission
    const inviterResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!inviterResponse.ok) {
      throw new Error("Failed to verify inviter permissions");
    }

    const inviterData = await inviterResponse.json();
    const inviter = inviterData.users?.find((u: any) => u.id === invitedBy);

    if (!inviter) {
      throw new Error("Inviter not found");
    }

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
      throw new Error("Invalid invitation ID");
    }

    if (invite.status !== "pending") {
      throw new Error("Invitation already used or cancelled");
    }

    if (new Date() > new Date(invite.expiresAt)) {
      // Mark as expired via API
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations/${invitationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          reason: 'expired'
        }),
      });

      throw new Error("Invitation expired");
    }

    // Create user account via API
    const signupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: invite.email,
        password,
        name,
        role: invite.role,
        sendInvitation: false // User is accepting invitation
      }),
    });

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create user account");
    }

    const userData = await signupResponse.json();

    if (!userData.user) {
      throw new Error("Failed to create user account - no user returned");
    }

    // Mark invitation as accepted via API
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations/${invitationId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'accept'
      }),
    });

    // Track the invitation as accepted
    try {
      await invitationTracking.trackAccepted({
        invitationId,
        email: invite.email,
        role: invite.role,
        userId: userData.user.id,
        inviterId: invite.inviterId,
        metadata: invitationTrackingUtils.generateMetadata({
          acceptedAt: new Date().toISOString(),
          newUserId: userData.user.id
        })
      });
    } catch (trackingError) {
      console.error("Failed to track invitation accepted event:", trackingError);
      // Don't fail the invitation acceptance if tracking fails
    }

    return {
      user: userData.user,
      session: userData.session
    };
  } catch (error) {
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