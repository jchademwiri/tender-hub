import { and, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profileUpdateRequest, user } from "@/db/schema";
import { AuditLogger } from "@/lib/audit-logger";
import { requireAuth } from "@/lib/auth-utils";
import { authValidationHelpers } from "@/lib/validations/auth";

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

export async function GET(_request: NextRequest) {
  try {
    // TODO: Implement user authentication
    // const currentUser = await requireAuth();

    // TODO: Get current user ID from session
    const currentUserId = "user-id"; // TODO: Get from session

    // TODO: Get user profile with related data
    const userProfile = await db
      .select({
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
      })
      .from(user)
      .where(eq(user.id, currentUserId))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // TODO: Calculate profile completeness
    const profile = userProfile[0];
    const completeness = calculateProfileCompleteness(profile);

    return NextResponse.json({
      profile: profile,
      completeness: {
        percentage: completeness,
        missingFields: getMissingFields(profile),
      },
    });
  } catch (error) {
    console.error("User profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await requireAuth();

    const body = await request.json();
    const { name, email } = body;

    // Validate input data using existing schema
    const validationResult = authValidationHelpers.safeValidateUpdateProfile({
      name,
      email,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const validatedData = validationResult.data;

    // Check if email is already taken by another user
    const existingUser = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.email, validatedData.email.toLowerCase()),
          ne(user.id, currentUser.id),
        ),
      )
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 },
      );
    }

    // Store previous values for audit logging
    const previousValues = {
      name: currentUser.name,
      email: currentUser.email,
    };

    // Update user profile
    const updatedUser = await db
      .update(user)
      .set({
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Audit log the profile update
    await AuditLogger.logUserUpdated(
      currentUser.id,
      {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
      },
      {
        userId: currentUser.id,
        previousValues,
        metadata: {
          updateType: "direct",
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      },
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedUser[0],
    });
  } catch (error) {
    console.error("User profile update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await requireAuth();

    const body = await request.json();
    const { changes, reason } = body;

    // Validate input - ensure changes object exists and has content
    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json(
        { error: "No changes specified" },
        { status: 400 },
      );
    }

    // Validate that at least one field is being changed
    const allowedFields = ["name", "email"];
    const invalidFields = Object.keys(changes).filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid fields: ${invalidFields.join(", ")}. Allowed fields: ${allowedFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate the changes using the profile update schema
    const validationResult =
      authValidationHelpers.safeValidateUpdateProfile(changes);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed for requested changes",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    // Check for existing pending requests
    const pendingRequests = await db
      .select()
      .from(profileUpdateRequest)
      .where(
        and(
          eq(profileUpdateRequest.userId, currentUser.id),
          eq(profileUpdateRequest.status, "pending"),
        ),
      )
      .limit(1);

    if (pendingRequests.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending profile update request" },
        { status: 409 },
      );
    }

    // Check if email is being changed and if it's already taken by another user
    if (changes.email) {
      const existingUser = await db
        .select()
        .from(user)
        .where(
          and(
            eq(user.email, changes.email.toLowerCase()),
            ne(user.id, currentUser.id),
          ),
        )
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 },
        );
      }
    }

    // Create profile update request
    const newRequest = await db
      .insert(profileUpdateRequest)
      .values({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        requestedChanges: {
          ...changes,
          email: changes.email?.toLowerCase(),
        },
        status: "pending",
        requestedAt: new Date(),
        rejectionReason: reason || null,
      })
      .returning();

    if (newRequest.length === 0) {
      return NextResponse.json(
        { error: "Failed to create profile update request" },
        { status: 500 },
      );
    }

    // Audit log the profile update request
    await AuditLogger.logProfileUpdateRequested(
      currentUser.id,
      {
        ...changes,
        email: changes.email?.toLowerCase(),
      },
      {
        userId: currentUser.id,
        metadata: {
          requestId: newRequest[0].id,
          reason: reason || "No reason provided",
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      },
    );

    return NextResponse.json(
      {
        message: "Profile update request submitted successfully",
        request: newRequest[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("User profile update request API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper functions
function calculateProfileCompleteness(profile: any): number {
  const fields = ["name", "email", "role"];
  const completedFields = fields.filter(
    (field) => profile[field] && profile[field].trim() !== "",
  ).length;
  return Math.round((completedFields / fields.length) * 100);
}

function getMissingFields(profile: any): string[] {
  const fields = ["name", "email", "role"];
  return fields.filter(
    (field) => !profile[field] || profile[field].trim() === "",
  );
}
