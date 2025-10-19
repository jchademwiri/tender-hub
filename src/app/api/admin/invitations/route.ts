import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI, getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/db';
import { invitation, user } from '@/db/schema';
import { desc, eq, like, and, sql } from 'drizzle-orm';
import { invitationQuerySchema } from '@/lib/validations/invitations';

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 INVITATION CREATION STARTED");
    console.log("Request method:", request.method);
    console.log("Request URL:", request.url);

    // Authenticate and authorize admin user
    console.log("🔐 Authenticating user...");
    const currentUser = await requireAdminForAPI();

    console.log("✅ User authenticated:", currentUser?.id);

    // Ensure currentUser.id exists
    if (!currentUser?.id) {
      console.error("❌ Current user ID is missing:", currentUser);
      return NextResponse.json({
        error: "Authentication error: User ID not found"
      }, { status: 401 });
    }

    const body = await request.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // Validate input
    console.log("🔍 Validating input...");
    const { email, role } = body;
    if (!email || !role) {
      console.error("❌ Missing required fields:", { email: !!email, role: !!role });
      return NextResponse.json({
        error: "Email and role are required"
      }, { status: 400 });
    }
    console.log("✅ Input validation passed for:", email, role);

    // Check if invitation already exists
    console.log("🔍 Checking for existing invitation for email:", email);
    const existingInvitation = await db.select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      inviterId: invitation.inviterId,
    })
      .from(invitation)
      .where(eq(invitation.email, email))
      .limit(1);

    if (existingInvitation.length > 0) {
      console.log("⚠️ Invitation already exists for email:", email);
      return NextResponse.json({
        error: "Invitation already exists for this email"
      }, { status: 409 });
    }
    console.log("✅ No existing invitation found");

    // Prepare invitation data - only include columns that exist in the database
    const invitationData = {
      id: crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      role: role || null, // role can be nullable in the database
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      inviterId: currentUser.id,
    };

    console.log("📋 Creating invitation with data:", JSON.stringify(invitationData, null, 2));

    // Create invitation
    console.log("💾 Inserting invitation into database...");
    const newInvitation = await db.insert(invitation).values(invitationData).returning();

    console.log("✅ Invitation created successfully:", newInvitation[0]?.id);
    console.log("📋 Invitation data:", JSON.stringify(newInvitation[0], null, 2));

    // Send email if requested
    console.log("📧 Checking if email should be sent...");
    console.log("sendEmail flag:", body.sendEmail);

    if (body.sendEmail !== false) {
      try {
        console.log("📧 Attempting to send invitation email...");
        const { sendEmail } = await import("@/lib/email");

        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${newInvitation[0].id}`;
        console.log("🔗 Generated invitation URL:", invitationUrl);

        const emailContent = `
          <h1>Welcome to Tender Hub!</h1>
          <p>You have been invited to join as a <strong>${newInvitation[0].role}</strong>.</p>
          <p>Click the link below to accept your invitation and create your account:</p>
          <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
          <p>This invitation expires in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        `;

        console.log("📧 Sending email to:", newInvitation[0].email);
        console.log("📧 Email subject: You're Invited to Join Tender Hub");

        await sendEmail({
          to: newInvitation[0].email,
          subject: "You're Invited to Join Tender Hub",
          html: emailContent,
        });

        console.log("✅ Invitation email sent successfully to:", newInvitation[0].email);
      } catch (emailError) {
        console.error("❌ Failed to send invitation email:", emailError);
        console.error("❌ Email error details:", emailError instanceof Error ? emailError.message : String(emailError));
        // Don't fail the request if email fails
      }
    } else {
      console.log("📧 Email sending skipped (sendEmail: false)");
    }

    return NextResponse.json({
      message: "Invitation created successfully",
      invitation: newInvitation[0]
    });

  } catch (error) {
    console.error("❌ Error creating invitation:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    // Provide more specific error information
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);

      // Check for specific database errors
      if (error.message.includes("violates foreign key constraint")) {
        console.error("❌ Database foreign key constraint violation");
        return NextResponse.json({
          error: "Database constraint error",
          message: "Invalid user reference"
        }, { status: 400 });
      }

      if (error.message.includes("violates not-null constraint")) {
        console.error("❌ Database not-null constraint violation");
        return NextResponse.json({
          error: "Missing required data",
          message: error.message
        }, { status: 400 });
      }

      if (error.message.includes("duplicate key value")) {
        console.error("❌ Database duplicate key violation");
        return NextResponse.json({
          error: "Duplicate entry",
          message: "An invitation for this email already exists"
        }, { status: 409 });
      }
    }

    console.error("❌ Returning internal server error");
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize admin user
    const currentUser = await requireAdminForAPI();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get('status');
    const rawRole = searchParams.get('role');

    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: rawStatus === 'all-statuses' ? undefined : rawStatus || undefined,
      role: rawRole === 'all-roles' ? undefined : rawRole || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Validate query parameters
    const validationResult = invitationQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid query parameters",
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { status, role, search, page, limit } = validationResult.data;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (status) {
      whereConditions.push(eq(invitation.status, status));
    }

    if (role) {
      whereConditions.push(eq(invitation.role, role));
    }

    if (search) {
      whereConditions.push(
        like(invitation.email, `%${search}%`)
      );
    }

    // Execute query - only select columns that exist in the database
    const invitationsQuery = db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        inviterId: invitation.inviterId,
      })
      .from(invitation)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(invitation.expiresAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(invitation)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const [invitationResults, countResult] = await Promise.all([
      invitationsQuery,
      countQuery
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      invitations: invitationResults,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        status,
        role,
        search,
      }
    });

  } catch (error) {
    console.error("API Error:", error);

    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message.includes("Authentication required") || error.message.includes("Admin access required")) {
        return NextResponse.json({
          error: "Authentication required",
          message: error.message
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}