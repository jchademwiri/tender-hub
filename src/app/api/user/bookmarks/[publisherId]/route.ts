import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { toggleBookmark } from "@/server/publisher";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publisherId: string }> },
) {
  try {
    const resolvedParams = await params;
    console.log("Bookmark API called with params:", resolvedParams);
    console.log("Request URL:", request.url);
    console.log("Request method:", request.method);

    const user = await getCurrentUser();
    console.log("Current user:", user);

    if (!user) {
      console.log("No user found, returning 401");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { publisherId } = resolvedParams;
    console.log("Publisher ID from params:", publisherId);
    console.log("Publisher ID type:", typeof publisherId);
    console.log("Publisher ID length:", publisherId?.length);
    console.log("Publisher ID is truthy:", !!publisherId);
    console.log("Publisher ID === 'undefined':", publisherId === "undefined");
    console.log("Publisher ID === 'null':", publisherId === "null");
    console.log("Publisher ID is empty string:", publisherId === "");
    console.log(
      "Publisher ID is '982a3ef8-250e-46db-9ce9-11641d793d64':",
      publisherId === "982a3ef8-250e-46db-9ce9-11641d793d64",
    );

    // Check if it's a valid UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    console.log(
      "Publisher ID matches UUID regex:",
      uuidRegex.test(publisherId),
    );
    console.log(
      "UUID regex test result for specific ID:",
      uuidRegex.test("982a3ef8-250e-46db-9ce9-11641d793d64"),
    );

    if (
      !publisherId ||
      publisherId === "undefined" ||
      publisherId === "null" ||
      publisherId === "" ||
      !uuidRegex.test(publisherId)
    ) {
      console.log("Invalid publisher ID provided, returning 400");
      return NextResponse.json(
        { error: "Publisher ID is required" },
        { status: 400 },
      );
    }

    console.log(
      "Calling toggleBookmark with userId:",
      user.id,
      "publisherId:",
      publisherId,
    );
    const result = await toggleBookmark(user.id, publisherId);
    console.log("Toggle bookmark result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 },
    );
  }
}
