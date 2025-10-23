import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { toggleBookmark } from "@/server/publisher";

export async function POST(
  request: NextRequest,
  { params }: { params: { publisherId: string } }
) {
  try {
    console.log("Bookmark API called with params:", params);

    const user = await getCurrentUser();
    console.log("Current user:", user);

    if (!user) {
      console.log("No user found, returning 401");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { publisherId } = params;
    console.log("Publisher ID:", publisherId);
    console.log("Publisher ID type:", typeof publisherId);
    console.log("Publisher ID length:", publisherId?.length);

    if (!publisherId || publisherId === 'undefined' || publisherId === 'null') {
      console.log("Invalid publisher ID provided, returning 400");
      return NextResponse.json(
        { error: "Publisher ID is required" },
        { status: 400 }
      );
    }

    console.log("Calling toggleBookmark with userId:", user.id, "publisherId:", publisherId);
    const result = await toggleBookmark(user.id, publisherId);
    console.log("Toggle bookmark result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}