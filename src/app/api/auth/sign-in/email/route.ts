import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "MISSING_CREDENTIALS", message: "Email and password are required" } },
        { status: 400 }
      );
    }

    // Use the existing auth API to sign in
    const result = await auth.api.signInEmail({
      headers: request.headers,
      body: { email, password }
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Set session cookie for persistence
    const response = NextResponse.json({
      user: result.user,
      session: result.session
    });

    if (result.session?.id) {
      response.cookies.set("session", result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60, // 24 hours
        path: "/"
      });
    }

    return response;
  } catch (error) {
    console.error("Sign-in API error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}