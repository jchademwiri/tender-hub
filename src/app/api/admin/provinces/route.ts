import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/db";
import { provinces } from "@/db/schema";
import { eq, ilike, desc } from "drizzle-orm";
import { AuditLogger } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let provincesList;

    if (search) {
      provincesList = await db
        .select()
        .from(provinces)
        .where(ilike(provinces.name, `%${search}%`))
        .orderBy(desc(provinces.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      provincesList = await db
        .select()
        .from(provinces)
        .orderBy(desc(provinces.createdAt))
        .limit(limit)
        .offset(offset);
    }
    const totalCount = await db.$count(provinces);

    // TODO: Add audit logging for province viewing

    return NextResponse.json({
      provinces: provincesList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return NextResponse.json(
      { error: "Failed to fetch provinces" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const description = formData.get("description") as string;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    // Check if province with same code already exists
    const existingProvince = await db
      .select()
      .from(provinces)
      .where(eq(provinces.code, code.toUpperCase()))
      .limit(1);

    if (existingProvince.length > 0) {
      return NextResponse.json(
        { error: "Province with this code already exists" },
        { status: 400 }
      );
    }

    const [newProvince] = await db
      .insert(provinces)
      .values({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description: description?.trim() || null,
      })
      .returning();

    // TODO: Add audit logging for province creation

    return NextResponse.json({ province: newProvince });
  } catch (error) {
    console.error("Error creating province:", error);
    return NextResponse.json(
      { error: "Failed to create province" },
      { status: 500 }
    );
  }
}