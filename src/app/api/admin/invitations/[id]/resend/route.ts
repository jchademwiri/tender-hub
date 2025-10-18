import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/db";
import { invitation } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuditLogger } from "@/lib/audit-logger";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

/**
 * Resend invitation validation schema
 */
const resendInvitationSchema = z.object({
  customMessage: z.string().optional(),
});

/**
 * POST /api/admin/invitations/[id]/resend
 * Resend an invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize admin user
    const currentUser = await requireAdmin();

    const { id: invitationId } = await params;

    // Validate request body
    const body = await request.json();
    const validationResult = resendInvitationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { customMessage } = validationResult.data;

    // Check if invitation exists
    const existingInvitation = await db
      .select()
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    if (existingInvitation.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    const invite = existingInvitation[0];

    // Check if invitation can be resent
    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Can only resend pending invitations" },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json(
        { error: "Cannot resend expired invitation. Please create a new invitation." },
        { status: 400 }
      );
    }

    // Get inviter information for the email
    const inviterResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!inviterResponse.ok) {
      throw new Error("Failed to fetch inviter information");
    }

    const inviterData = await inviterResponse.json();
    const inviter = inviterData.users?.find((u: any) => u.id === invite.inviterId);

    if (!inviter) {
      throw new Error("Inviter not found");
    }

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.id}`;

    // Prepare email content
    const baseEmailContent = `
      <h1>Welcome to Tender Hub!</h1>
      <p>${inviter.name} has invited you to join as a <strong>${invite.role}</strong>.</p>
      <p>Click the link below to accept your invitation and create your account:</p>
      <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
      <p>This invitation expires in 7 days.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `;

    const emailContent = customMessage
      ? `${baseEmailContent}<p><strong>Message from ${inviter.name}:</strong> ${customMessage}</p>`
      : baseEmailContent;

    // Send invitation email
    await sendEmail({
      to: invite.email,
      subject: `Invitation Reminder - Tender Hub`,
      html: emailContent,
    });

    // Log the resend action
    await AuditLogger.logInvitationResent(
      invite.email,
      invitationId,
      currentUser.id,
      {
        userId: currentUser.id,
        metadata: {
          customMessage: !!customMessage,
          resentAt: new Date().toISOString(),
          invitationUrl,
          source: "admin_api"
        }
      }
    );

    return NextResponse.json({
      message: "Invitation resent successfully",
      invitation: {
        id: invitationId,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        resentAt: new Date().toISOString(),
        expiresAt: invite.expiresAt,
        customMessage: !!customMessage
      }
    });

  } catch (error) {
    console.error("Admin resend invitation API error:", error);

    // Handle specific invitation errors
    if (error instanceof Error) {
      if (error.message.includes("Invitation not found")) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes("Can only resend pending invitations")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes("Cannot resend expired invitation")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes("Inviter not found")) {
        return NextResponse.json(
          { error: "Inviter information not found" },
          { status: 500 }
        );
      }
      if (error.message.includes("Failed to send email")) {
        return NextResponse.json(
          { error: "Failed to send invitation email" },
          { status: 500 }
        );
      }
      if (error.message.includes("Unauthorized") || error.message.includes("Insufficient permissions")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}