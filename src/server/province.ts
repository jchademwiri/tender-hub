"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { provinces } from "@/db/schema";
import {
  classifyError,
  createAppError,
  getUserFriendlyMessage,
  logError,
  retryWithBackoff,
} from "@/lib/error-utils";

export async function deleteProvince(formData: FormData) {
  const id = formData.get("id") as string;

  // Validation
  if (!id) {
    const error = createAppError("Province ID is required", {
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
        await db.delete(provinces).where(eq(provinces.id, id));
      },
      {
        maxRetries: 2,
        shouldRetry: (error) => {
          const message = error.message.toLowerCase();
          return message.includes("connection") || message.includes("timeout");
        },
        onRetry: (error, attempt) => {
          logError(
            createAppError(`Delete province retry attempt ${attempt}`, {
              details: { originalError: error },
            }),
            "medium",
          );
        },
      },
    );
  } catch (error) {
    const appError = createAppError(
      `Failed to delete province: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "DELETE_FAILED",
        statusCode: 500,
        details: { provinceId: id, originalError: error },
      },
    );
    logError(appError, classifyError(appError));
    throw appError;
  }

  redirect("/admin/provinces");
}

export async function createProvince(_prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const description = formData.get("description") as string;

  // Validation
  if (!name?.trim()) {
    const error = createAppError("Province name is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "name" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  if (!code?.trim()) {
    const error = createAppError("Province code is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "code" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  // Validate code format (should be 2-3 characters, alphanumeric)
  if (!/^[A-Z]{2,3}$/.test(code.trim())) {
    const error = createAppError(
      "Province code must be 2-3 uppercase letters",
      {
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: { field: "code", value: code },
      },
    );
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  try {
    // Use retry mechanism for database operations
    await retryWithBackoff(
      async () => {
        await db.insert(provinces).values({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description?.trim() || null,
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
            createAppError(`Create province retry attempt ${attempt}`, {
              details: { originalError: error, provinceName: name },
            }),
            "medium",
          );
        },
      },
    );
  } catch (error) {
    const appError = createAppError(
      `Failed to create province: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "CREATE_FAILED",
        statusCode: 500,
        details: {
          provinceName: name,
          provinceCode: code,
          originalError: error,
        },
      },
    );
    logError(appError, classifyError(appError));
    return { error: getUserFriendlyMessage(appError) };
  }

  // Redirect OUTSIDE the try-catch
  redirect("/admin/provinces");
}

export async function updateProvince(_prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const description = formData.get("description") as string;

  // Validation
  if (!id) {
    const error = createAppError("Province ID is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "id" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  if (!name?.trim()) {
    const error = createAppError("Province name is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "name" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  if (!code?.trim()) {
    const error = createAppError("Province code is required", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "code" },
    });
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  // Validate code format (should be 2-3 characters, alphanumeric)
  if (!/^[A-Z]{2,3}$/.test(code.trim())) {
    const error = createAppError(
      "Province code must be 2-3 uppercase letters",
      {
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: { field: "code", value: code },
      },
    );
    logError(error, classifyError(error));
    return { error: getUserFriendlyMessage(error) };
  }

  try {
    // Use retry mechanism for database operations
    await retryWithBackoff(
      async () => {
        await db
          .update(provinces)
          .set({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description?.trim() || null,
          })
          .where(eq(provinces.id, id));
      },
      {
        maxRetries: 2,
        shouldRetry: (error) => {
          const message = error.message.toLowerCase();
          return message.includes("connection") || message.includes("timeout");
        },
        onRetry: (error, attempt) => {
          logError(
            createAppError(`Update province retry attempt ${attempt}`, {
              details: { originalError: error, provinceId: id },
            }),
            "medium",
          );
        },
      },
    );
  } catch (error) {
    const appError = createAppError(
      `Failed to update province: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        code: "UPDATE_FAILED",
        statusCode: 500,
        details: { provinceId: id, provinceName: name, originalError: error },
      },
    );
    logError(appError, classifyError(appError));
    return { error: getUserFriendlyMessage(appError) };
  }

  // Redirect OUTSIDE the try-catch
  redirect("/admin/provinces");
}
