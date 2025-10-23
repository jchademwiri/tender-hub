"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { provinces, publishers, userBookmarks } from "@/db/schema";
import {
  classifyError,
  createAppError,
  getUserFriendlyMessage,
  logError,
  retryWithBackoff,
} from "@/lib/error-utils";

export async function getAllPublishers(userId?: string) {
  try {
    const result = await retryWithBackoff(
      async () => {
        if (userId) {
          const publishersWithBookmarks = await db
            .select({
              id: publishers.id,
              name: publishers.name,
              website: publishers.website,
              bookmarkId: userBookmarks.id,
            })
            .from(publishers)
            .leftJoin(
              userBookmarks,
              eq(userBookmarks.publisherId, publishers.id) && eq(userBookmarks.userId, userId)
            )
            .orderBy(publishers.name);

          return publishersWithBookmarks.map(p => ({
            id: p.id,
            name: p.name,
            website: p.website,
            isBookmarked: !!p.bookmarkId,
          }));
        } else {
          return await db
            .select({
              id: publishers.id,
              name: publishers.name,
              website: publishers.website,
            })
            .from(publishers)
            .orderBy(publishers.name);
        }
      },
      {
        maxRetries: 2,
        shouldRetry: (error) => {
          const message = error.message.toLowerCase();
          return message.includes("connection") || message.includes("timeout");
        },
        onRetry: (error, attempt) => {
          logError(
            createAppError(`Get all publishers retry attempt ${attempt}`, {
              details: { originalError: error },
            }),
            "medium",
          );
        },
      },
    );
    return result;
  } catch (error) {
    const appError = createAppError(
      `Failed to fetch publishers: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "FETCH_FAILED",
        statusCode: 500,
        details: { originalError: error },
      },
    );
    logError(appError, classifyError(appError));
    throw appError;
  }
}

export async function deletePublisher(formData: FormData) {
  const id = formData.get("id") as string;

  // Validation
  if (!id) {
    const error = createAppError("Publisher ID is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "id" },
    });
    logError(error, classifyError(error));
    throw error;
  }

  try {
    // Use retry mechanism for database operations
    await retryWithBackoff(
      async () => {
        await db.delete(publishers).where(eq(publishers.id, id));
      },
      {
        maxRetries: 2,
        shouldRetry: (error) => {
          const message = error.message.toLowerCase();
          return message.includes("connection") || message.includes("timeout");
        },
        onRetry: (error, attempt) => {
          logError(
            createAppError(`Delete publisher retry attempt ${attempt}`, {
              details: { originalError: error },
            }),
            "medium",
          );
        },
      },
    );
  } catch (error) {
    const appError = createAppError(
      `Failed to delete publisher: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "DELETE_FAILED",
        statusCode: 500,
        details: { publisherId: id, originalError: error },
      },
    );
    logError(appError, classifyError(appError));
    throw appError;
  }

  // Redirect after successful deletion
  redirect("/admin/publishers");
}

export async function updatePublisher(_prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const website = formData.get("website") as string;
  const province_id = formData.get("province_id") as string;

  // Validation
  if (!id) {
    const error = createAppError("Publisher ID is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "id" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  if (!name?.trim()) {
    const error = createAppError("Publisher name is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "name" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  if (!province_id) {
    const error = createAppError("Province is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "province_id" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  try {
    // Use retry mechanism for database operations
    await retryWithBackoff(
      async () => {
        await db
          .update(publishers)
          .set({
            name: name.trim(),
            website: website?.trim() || null,
            province_id,
          })
          .where(eq(publishers.id, id));
      },
      {
        maxRetries: 2,
        shouldRetry: (error) => {
          const message = error.message.toLowerCase();
          return message.includes("connection") || message.includes("timeout");
        },
        onRetry: (error, attempt) => {
          logError(
            createAppError(`Update publisher retry attempt ${attempt}`, {
              details: { originalError: error, publisherId: id },
            }),
            "medium",
          );
        },
      },
    );
  } catch (error) {
    const appError = createAppError(
      `Failed to update publisher: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "UPDATE_FAILED",
        statusCode: 500,
        details: { publisherId: id, originalError: error },
      },
    );
    logError(appError, classifyError(appError));
    return { error: getUserFriendlyMessage(appError) };
  }

  // Redirect OUTSIDE the try-catch
  redirect("/admin/publishers");
}

export async function createPublisher(_prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const website = formData.get("website") as string;
  const province_id = formData.get("province_id") as string;

  // Validation
  if (!name?.trim()) {
    const error = createAppError("Publisher name is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "name" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  if (!province_id) {
    const error = createAppError("Province is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "province_id" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  // Validate website URL format if provided
  if (website?.trim()) {
    try {
      new URL(website.trim());
    } catch {
      const error = createAppError("Invalid website URL format", {
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: { field: "website", value: website },
      });
      logError(error, classifyError(error));
      return { error: getUserFriendlyMessage(error) };
    }
  }

  try {
    // Use retry mechanism for database operations
    await retryWithBackoff(
      async () => {
        await db.insert(publishers).values({
          name: name.trim(),
          website: website?.trim() || null,
          province_id,
        });
      },
      {
        maxRetries: 2,
        shouldRetry: (error) => {
          const message = error.message.toLowerCase();
          return message.includes("connection") || message.includes("timeout");
        },
        onRetry: (error, attempt) => {
          logError(
            createAppError(`Create publisher retry attempt ${attempt}`, {
              details: { originalError: error, publisherName: name },
            }),
            "medium",
          );
        },
      },
    );
  } catch (error) {
    const appError = createAppError(
      `Failed to create publisher: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "CREATE_FAILED",
        statusCode: 500,
        details: { publisherName: name, originalError: error },
      },
    );
    logError(appError, classifyError(appError));
    return { error: getUserFriendlyMessage(appError) };
  }

  // Redirect OUTSIDE the try-catch
  redirect("/admin/publishers");
}

export async function toggleBookmark(userId: string, publisherId: string) {
  try {
    // Check if bookmark exists
    const existingBookmark = await db
      .select()
      .from(userBookmarks)
      .where(eq(userBookmarks.userId, userId) && eq(userBookmarks.publisherId, publisherId))
      .limit(1);

    if (existingBookmark.length > 0) {
      // Remove bookmark
      await db
        .delete(userBookmarks)
        .where(eq(userBookmarks.id, existingBookmark[0].id));
      return { bookmarked: false };
    } else {
      // Add bookmark
      await db.insert(userBookmarks).values({
        userId,
        publisherId,
      });
      return { bookmarked: true };
    }
  } catch (error) {
    const appError = createAppError(
      `Failed to toggle bookmark: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "TOGGLE_BOOKMARK_FAILED",
        statusCode: 500,
        details: { userId, publisherId, originalError: error },
      },
    );
    logError(appError, classifyError(appError));
    throw appError;
  }
}
