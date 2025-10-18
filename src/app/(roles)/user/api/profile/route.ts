import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/db";
import { user, profileUpdateRequest } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

/**
 * TODO: User Profile API Implementation Checklist
 *
 * PROFILE MANAGEMENT:
 * [ ] GET /api/user/profile - Get current user profile
 * [ ] PUT /api/user/profile - Update user profile information
 * [ ] POST /api/user/profile/request-update - Request profile update (approval required)
 * [ ] GET /api/user/profile/update-requests - View profile update request history
 * [ ] GET /api/user/profile/completeness - Profile completion percentage
 *
 * PROFILE UPDATE WORKFLOW:
 * [ ] POST /api/user/profile/request-role-change - Request role change
 * [ ] POST /api/user/profile/request-info-update - Request information update
 * [ ] GET /api/user/profile/pending-requests - Check pending approval requests
 * [ ] POST /api/user/profile/cancel-request - Cancel pending request
 *
 * PROFILE VALIDATION:
 * [ ] Input validation for profile fields
 * [ ] Email format and uniqueness validation
 * [ ] Name and contact information validation
 * [ ] Role-specific field requirements
 */

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement user authentication
    // const currentUser = await requireAuth();

    // TODO: Get current user ID from session
    const currentUserId = "user-id"; // TODO: Get from session

    // TODO: Get user profile with related data
    const userProfile = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      invitedBy: user.invitedBy,
      invitedAt: user.invitedAt,
      // TODO: Add profile picture, bio, contact info fields
    }).from(user).where(eq(user.id, currentUserId)).limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // TODO: Calculate profile completeness
    const profile = userProfile[0];
    const completeness = calculateProfileCompleteness(profile);

    return NextResponse.json({
      profile: profile,
      completeness: {
        percentage: completeness,
        missingFields: getMissingFields(profile)
      }
    });

  } catch (error) {
    console.error("User profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement user authentication
    // const currentUser = await requireAuth();

    const body = await request.json();
    const { name, email, bio, phone, department } = body;

    // TODO: Get current user ID from session
    const currentUserId = "user-id"; // TODO: Get from session

    // TODO: Validate input data
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // TODO: Check if email is already taken by another user
    const existingUser = await db.select().from(user)
      .where(and(
        eq(user.email, email),
        ne(user.id, currentUserId)
      )).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      );
    }

    // TODO: Update user profile
    const updatedUser = await db.update(user)
      .set({
        name,
        email,
        // TODO: Add bio, phone, department fields if they exist in schema
        updatedAt: new Date()
      })
      .where(eq(user.id, currentUserId))
      .returning();

    // TODO: Audit log the profile update

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedUser[0]
    });

  } catch (error) {
    console.error("User profile update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement user authentication
    // const currentUser = await requireAuth();

    const body = await request.json();
    const { changes, reason } = body;

    // TODO: Get current user ID from session
    const currentUserId = "user-id"; // TODO: Get from session

    // TODO: Validate input
    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json(
        { error: "No changes specified" },
        { status: 400 }
      );
    }

    // TODO: Check for existing pending requests
    const pendingRequests = await db.select().from(profileUpdateRequest)
      .where(and(
        eq(profileUpdateRequest.userId, currentUserId),
        eq(profileUpdateRequest.status, "pending")
      )).limit(1);

    if (pendingRequests.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending profile update request" },
        { status: 409 }
      );
    }

    // TODO: Create profile update request
    const newRequest = await db.insert(profileUpdateRequest).values({
      id: crypto.randomUUID(),
      userId: currentUserId,
      requestedChanges: changes,
      status: "pending",
      requestedAt: new Date(),
      // TODO: Add reason field if exists in schema
    }).returning();

    // TODO: Audit log the request

    return NextResponse.json({
      message: "Profile update request submitted successfully",
      request: newRequest[0]
    }, { status: 201 });

  } catch (error) {
    console.error("User profile update request API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// TODO: Helper functions
function calculateProfileCompleteness(profile: any): number {
  const fields = ['name', 'email', 'role'];
  const completedFields = fields.filter(field => profile[field]).length;
  return Math.round((completedFields / fields.length) * 100);
}

function getMissingFields(profile: any): string[] {
  const fields = ['name', 'email', 'role'];
  return fields.filter(field => !profile[field]);
}