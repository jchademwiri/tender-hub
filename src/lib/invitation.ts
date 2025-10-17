import { db } from "@/db";
import { invitation, user, auditLog } from "@/db/schema";
import { eq, and, gte, count, lt } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { checkPermission } from "@/lib/permissions";
import { auth } from "@/lib/auth";

export async function createInvitation({
  email,
  role,
  invitedBy,
}: {
  email: string;
  role: "admin" | "manager" | "user";
  invitedBy: string;
}) {
  // Get inviter
  const inviterResult = await db.select().from(user).where(eq(user.id, invitedBy)).limit(1);
  const inviter = inviterResult[0];

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

  // ✅ Check invitation quota (prevent spam)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentInvitations = await db.select({ count: count() })
    .from(invitation)
    .where(and(
      eq(invitation.inviterId, invitedBy),
      gte(invitation.expiresAt, last24Hours) // Using expiresAt as proxy for createdAt
    ));

  const quotas = { admin: 50, manager: 20, user: 0 } as const;
  const userRole = (inviter.role || 'user') as keyof typeof quotas;
  if (recentInvitations[0].count >= quotas[userRole]) {
    throw new Error(`Daily invitation limit reached (${quotas[userRole]})`);
  }

  // Check if user already exists
  const existingUserResult = await db.select().from(user).where(eq(user.email, email)).limit(1);
  const existingUser = existingUserResult[0];

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Check for pending invitation
  const pendingInviteResult = await db.select().from(invitation)
    .where(and(
      eq(invitation.email, email),
      eq(invitation.status, "pending")
    )).limit(1);
  const pendingInvite = pendingInviteResult[0];

  if (pendingInvite) {
    throw new Error("Invitation already sent to this email");
  }

  // Create invitation
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [newInvitation] = await db
    .insert(invitation)
    .values({
      id: crypto.randomUUID(),
      email,
      role,
      inviterId: invitedBy,
      expiresAt,
      status: "pending",
    })
    .returning();

  // Send invitation email
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?id=${newInvitation.id}`;

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

  // Audit log
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    userId: invitedBy,
    action: "invitation_created",
    metadata: { email, role },
  });

  return newInvitation;
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
  // Find invitation
  const inviteResult = await db.select().from(invitation).where(eq(invitation.id, invitationId)).limit(1);
  const invite = inviteResult[0];

  if (!invite) {
    throw new Error("Invalid invitation ID");
  }

  if (invite.status !== "pending") {
    throw new Error("Invitation already used or cancelled");
  }

  if (new Date() > invite.expiresAt) {
    // Mark as expired
    await db.update(invitation)
      .set({ status: "expired" })
      .where(eq(invitation.id, invite.id));

    throw new Error("Invitation expired");
  }

  // ✅ CRITICAL FIX: Use Better Auth signUp to create user with password
  const result = await auth.api.signUpEmail({
    body: {
      email: invite.email,
      password, // ✅ Password set during acceptance
      name,
    }
  });

  if (!result.user) {
    throw new Error("Failed to create user account");
  }

  // Update user with invitation metadata
  await db.update(user)
    .set({
      role: invite.role,
      status: "active",
      emailVerified: true,
      invitedBy: invite.inviterId,
    })
    .where(eq(user.id, result.user.id));

  // Mark invitation as accepted
  await db.update(invitation)
    .set({ status: "accepted" })
    .where(eq(invitation.id, invite.id));

  // Audit log
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    userId: result.user.id,
    action: "invitation_accepted",
    metadata: { inviterId: invite.inviterId, role: invite.role }
  });

  return result;
}

export async function resendInvitation(invitationId: string, requesterId: string) {
  const inviteResult = await db.select().from(invitation).where(eq(invitation.id, invitationId)).limit(1);
  const invite = inviteResult[0];

  if (!invite) {
    throw new Error("Invitation not found");
  }

  if (invite.status !== "pending") {
    throw new Error("Can only resend pending invitations");
  }

  const requesterResult = await db.select().from(user).where(eq(user.id, requesterId)).limit(1);
  const requester = requesterResult[0];

  if (!requester) {
    throw new Error("Requester not found");
  }

  const permissions = checkPermission(requester);
  if (!permissions.canInviteUsers()) {
    throw new Error("Insufficient permissions");
  }

  // Extend expiration
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.update(invitation)
    .set({ expiresAt: newExpiresAt })
    .where(eq(invitation.id, invitationId));

  // Resend email
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?id=${invitationId}`;

  await sendEmail({
    to: invite.email,
    subject: "Reminder: Your Tender Hub Invitation",
    html: `
      <h1>Invitation Reminder</h1>
      <p>You were invited to join Tender Hub as a ${invite.role}.</p>
      <a href="${invitationUrl}">Accept Invitation</a>
      <p>This invitation expires in 7 days.</p>
    `
  });

  return { success: true };
}

export async function cancelInvitation(invitationId: string, requesterId: string) {
  const inviteResult = await db.select().from(invitation).where(eq(invitation.id, invitationId)).limit(1);
  const invite = inviteResult[0];

  if (!invite) {
    throw new Error("Invitation not found");
  }

  // Only inviter or admin can cancel
  const requesterResult = await db.select().from(user).where(eq(user.id, requesterId)).limit(1);
  const requester = requesterResult[0];

  if (!requester) {
    throw new Error("Requester not found");
  }

  if (invite.inviterId !== requesterId && requester.role !== "admin") {
    throw new Error("Only the inviter or an admin can cancel this invitation");
  }

  if (invite.status !== "pending") {
    throw new Error("Can only cancel pending invitations");
  }

  await db.update(invitation)
    .set({ status: "cancelled" })
    .where(eq(invitation.id, invitationId));

  // Audit log
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    userId: requesterId,
    action: "invitation_cancelled",
    metadata: { invitationId, email: invite.email }
  });

  return { success: true };
}