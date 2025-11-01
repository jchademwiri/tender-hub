import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { provinces, publishers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _user = await requireAdmin();
    const { id } = await params;

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const website = formData.get("website") as string;
    const province_id = formData.get("province_id") as string;

    if (!name || !province_id) {
      return NextResponse.json(
        { error: "Name and province are required" },
        { status: 400 },
      );
    }

    // Verify province exists
    const provinceExists = await db
      .select()
      .from(provinces)
      .where(eq(provinces.id, province_id))
      .limit(1);

    if (provinceExists.length === 0) {
      return NextResponse.json(
        { error: "Selected province does not exist" },
        { status: 400 },
      );
    }

    const [updatedPublisher] = await db
      .update(publishers)
      .set({
        name: name.trim(),
        website: website?.trim() || null,
        province_id,
      })
      .where(eq(publishers.id, id))
      .returning();

    if (!updatedPublisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 },
      );
    }

    // TODO: Add audit logging for publisher update

    return NextResponse.json({ publisher: updatedPublisher });
  } catch (error) {
    console.error("Error updating publisher:", error);
    return NextResponse.json(
      { error: "Failed to update publisher" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _user = await requireAdmin();
    const { id } = await params;

    const [deletedPublisher] = await db
      .delete(publishers)
      .where(eq(publishers.id, id))
      .returning();

    if (!deletedPublisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 },
      );
    }

    // TODO: Add audit logging for publisher deletion

    return NextResponse.json({ publisher: deletedPublisher });
  } catch (error) {
    console.error("Error deleting publisher:", error);
    return NextResponse.json(
      { error: "Failed to delete publisher" },
      { status: 500 },
    );
  }
}
