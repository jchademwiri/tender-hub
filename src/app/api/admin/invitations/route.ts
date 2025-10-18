import { NextRequest, NextResponse } from 'next/server';
import { requireAdminForAPI, getCurrentUser } from '@/lib/auth-utils';
import { db } from '@/db';
import { invitation, user } from '@/db/schema';
import { desc, eq, like, and, sql } from 'drizzle-orm';
import { invitationQuerySchema } from '@/lib/validations/invitations';

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

    // Execute query with inviter information
    const invitationsQuery = db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        inviter: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      })
      .from(invitation)
      .leftJoin(user, eq(invitation.inviterId, user.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(invitation.createdAt))
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