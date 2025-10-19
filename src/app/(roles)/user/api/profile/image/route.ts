import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { AuditLogger } from "@/lib/audit-logger";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Profile Image Upload API
 * POST /api/user/profile/image - Upload and update user profile image
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await requireAuth();

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed",
        },
        { status: 400 },
      );
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 2MB" },
        { status: 400 },
      );
    }

    // Convert file to base64 for storage
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${imageFile.type};base64,${buffer.toString("base64")}`;

    // Store previous image for audit logging
    const previousImage = currentUser.image;

    // Update user profile with new image
    const updatedUser = await db
      .update(user)
      .set({
        image: base64Image,
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Audit log the profile image update
    await AuditLogger.logUserUpdated(
      currentUser.id,
      {
        image: base64Image,
      },
      {
        userId: currentUser.id,
        previousValues: {
          image: previousImage,
        },
        metadata: {
          updateType: "image_upload",
          fileName: imageFile.name,
          fileSize: imageFile.size,
          fileType: imageFile.type,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      },
    );

    return NextResponse.json({
      message: "Profile image updated successfully",
      profile: updatedUser[0],
    });
  } catch (error) {
    console.error("Profile image upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
