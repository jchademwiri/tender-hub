import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI, getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/db';
import { invitation, user } from '@/db/schema';
import { desc, eq, like, and, sql } from 'drizzle-orm';
import { invitationQuerySchema } from '@/lib/validations/invitations';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize admin user
    const currentUser = await requireAdminForAPI();

    // Ensure currentUser.id exists
    if (!currentUser?.id) {
      console.error("Current user ID is missing:", currentUser);
      return NextResponse.json({
        error: "Authentication error: User ID not found"
      }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Validate input
    const { email, role } = body;
    if (!email || !role) {
      console.error("Missing required fields:", { email: !!email, role: !!role });
      return NextResponse.json({
        error: "Email and role are required"
      }, { status: 400 });
    }

    // Check if invitation already exists
    console.log("Checking for existing invitation for email:", email);
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
      console.log("Invitation already exists for email:", email);
      return NextResponse.json({
        error: "Invitation already exists for this email"
      }, { status: 409 });
    }

    // Prepare invitation data - only include columns that exist in the database
    const invitationData = {
      id: crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      role: role || null, // role can be nullable in the database
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      inviterId: currentUser.id,
    };

    console.log("Creating invitation with data:", JSON.stringify(invitationData, null, 2));

    // Create invitation
    const newInvitation = await db.insert(invitation).values(invitationData).returning();

    console.log("Invitation created successfully:", newInvitation[0]?.id);

    return NextResponse.json({
      message: "Invitation created successfully",
      invitation: newInvitation[0]
    });

  } catch (error) {
    console.error("Error creating invitation:", error);

    // Provide more specific error information
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);

      // Check for specific database errors
      if (error.message.includes("violates foreign key constraint")) {
        return NextResponse.json({
          error: "Database constraint error",
          message: "Invalid user reference"
        }, { status: 400 });
      }

      if (error.message.includes("violates not-null constraint")) {
        return NextResponse.json({
          error: "Missing required data",
          message: error.message
        }, { status: 400 });
      }

      if (error.message.includes("duplicate key value")) {
        return NextResponse.json({
          error: "Duplicate entry",
          message: "An invitation for this email already exists"
        }, { status: 409 });
      }
    }

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