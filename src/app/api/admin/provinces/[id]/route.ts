import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/db";
import { provinces } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const description = formData.get("description") as string;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 },
      );
    }

    // Check if another province with same code exists (excluding current)
    const existingProvince = await db
      .select()
      .from(provinces)
      .where(eq(provinces.code, code.toUpperCase()))
      .limit(1);

    if (existingProvince.length > 0 && existingProvince[0].id !== id) {
      return NextResponse.json(
        { error: "Province with this code already exists" },
        { status: 400 },
      );
    }

    const [updatedProvince] = await db
      .update(provinces)
      .set({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description: description?.trim() || null,
      })
      .where(eq(provinces.id, id))
      .returning();

    if (!updatedProvince) {
      return NextResponse.json(
        { error: "Province not found" },
        { status: 404 },
      );
    }

    // TODO: Add audit logging for province update

    return NextResponse.json({ province: updatedProvince });
  } catch (error) {
    console.error("Error updating province:", error);
    return NextResponse.json(
      { error: "Failed to update province" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    // Check if province has associated publishers
    // TODO: Implement publisher count check
    const publishersCount = 0;

    if (publishersCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete province with associated publishers" },
        { status: 400 },
      );
    }

    const [deletedProvince] = await db
      .delete(provinces)
      .where(eq(provinces.id, id))
      .returning();

    if (!deletedProvince) {
      return NextResponse.json(
        { error: "Province not found" },
        { status: 404 },
      );
    }

    // TODO: Add audit logging for province deletion

    return NextResponse.json({ province: deletedProvince });
  } catch (error) {
    console.error("Error deleting province:", error);
    return NextResponse.json(
      { error: "Failed to delete province" },
      { status: 500 },
    );
  }
}
