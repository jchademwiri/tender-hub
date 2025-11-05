import { desc, eq, ilike } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { provinces, publishers } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Simple Publishers API: Starting request");
    
    // Simple auth check - just verify user is logged in
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    console.log("Simple Publishers API: Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    });

    if (!session?.user) {
      console.log("Simple Publishers API: No user session, returning 401");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.log("Simple Publishers API: User authenticated, fetching data");

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
        })
        .from(publishers)
        .leftJoin(provinces, eq(publishers.province_id, provinces.id))
        .orderBy(desc(publishers.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const totalCount = await db.$count(publishers);

    console.log("Simple Publishers API: Data fetched successfully", {
      publishersCount: publishersList.length,
      totalCount,
    });

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
    console.error("Simple Publishers API: Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch publishers", details: error.message },
      { status: 500 }
    );
  }
}