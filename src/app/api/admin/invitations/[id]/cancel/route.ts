import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { invitation } from "@/db/schema";
import { AuditLogger } from "@/lib/audit-logger";
import { requireAdminForAPI } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email";

/**
 * Cancel invitation validation schema
 */
const cancelInvitationSchema = z.object({
  reason: z
    .enum(["manual", "expired", "bounced", "complaint", "suppressed"])
    .optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/invitations/[id]/cancel
 * Cancel an invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate and authorize admin user
    const currentUser = await requireAdminForAPI();

    const { id: invitationId } = await params;

    // Validate request body
    const body = await request.json();
    const validationResult = cancelInvitationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { reason = "manual", notes } = validationResult.data;

    // Check if invitation exists
    const existingInvitation = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    if (existingInvitation.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    const invite = existingInvitation[0];

    // Check if invitation can be cancelled
    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Can only cancel pending invitations" },
        { status: 400 },
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json(
        { error: "Invitation has already expired" },
        { status: 400 },
      );
    }

    // Update invitation status to cancelled
    await db
      .update(invitation)
      .set({
        status: "cancelled",
      })
      .where(eq(invitation.id, invitationId));

    // Log the cancellation
    await AuditLogger.logInvitationCancelled(
      invite.email,
      invitationId,
      currentUser.id,
      {
        userId: currentUser.id,
        metadata: {
          reason,
          notes,
          cancelledAt: new Date().toISOString(),
          previousStatus: invite.status,
          source: "admin_api",
        },
      },
    );

    // Send cancellation notification email if reason is manual
    if (reason === "manual" && notes) {
      try {
        await sendEmail({
          to: invite.email,
          subject: "Invitation Cancelled - Tender Hub",
          html: `
            <h1>Invitation Cancelled</h1>
            <p>Your invitation to join Tender Hub has been cancelled.</p>
            ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
            <p>If you believe this was an error or have questions, please contact our support team.</p>
            <p>Best regards,<br>Tender Hub Team</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message: "Invitation cancelled successfully",
      invitation: {
        id: invitationId,
        email: invite.email,
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        reason,
        notes,
      },
    });
  } catch (error) {
    console.error("Admin cancel invitation API error:", error);

    // Handle specific invitation errors
    if (error instanceof Error) {
      if (error.message.includes("Invitation not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("Can only cancel pending invitations")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("Invitation has already expired")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("Insufficient permissions")
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
