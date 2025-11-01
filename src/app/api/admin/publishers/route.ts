import { desc, eq, ilike } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { provinces, publishers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const _user = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    let publishersList;

    if (search) {
      publishersList = await db
        .select({
          id: publishers.id,
          name: publishers.name,
          website: publishers.website,
          province_id: publishers.province_id,
          province_name: provinces.name,
          createdAt: publishers.createdAt,
          // updatedAt: publishers.updatedAt, // TODO: Add updatedAt to publishers table
        })
        .from(publishers)
        .leftJoin(provinces, eq(publishers.province_id, provinces.id))
        .where(ilike(publishers.name, `%${search}%`))
        .orderBy(desc(publishers.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      publishersList = await db
        .select({
          id: publishers.id,
          name: publishers.name,
          website: publishers.website,
          province_id: publishers.province_id,
          province_name: provinces.name,
          createdAt: publishers.createdAt,
          // updatedAt: publishers.updatedAt, // TODO: Add updatedAt to publishers table
        })
        .from(publishers)
        .leftJoin(provinces, eq(publishers.province_id, provinces.id))
        .orderBy(desc(publishers.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const totalCount = await db.$count(publishers);

    // DEBUG: Log publishers list and count
    console.log(
      `[DEBUG] Publishers API - Page: ${page}, Limit: ${limit}, Search: ${search}`,
    );
    console.log(`[DEBUG] Total publishers count: ${totalCount}`);
    console.log(`[DEBUG] Publishers list length: ${publishersList.length}`);
    console.log(
      `[DEBUG] Publishers list:`,
      publishersList.map((p) => ({ id: p.id, name: p.name })),
    );

    // TODO: Add audit logging for publisher viewing

    return NextResponse.json({
      publishers: publishersList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching publishers:", error);
    return NextResponse.json(
      { error: "Failed to fetch publishers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const _user = await requireAdmin();

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

    const [newPublisher] = await db
      .insert(publishers)
      .values({
        name: name.trim(),
        website: website?.trim() || null,
        province_id,
      })
      .returning();

    // TODO: Add audit logging for publisher creation

    return NextResponse.json({ publisher: newPublisher });
  } catch (error) {
    console.error("Error creating publisher:", error);
    return NextResponse.json(
      { error: "Failed to create publisher" },
      { status: 500 },
    );
  }
}
