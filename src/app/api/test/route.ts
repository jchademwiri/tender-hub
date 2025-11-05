import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("Test API route called");
    
    // Test basic response
    const basicTest = { message: "API is working", timestamp: new Date().toISOString() };
    
    // Test auth session
    let authTest = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      authTest = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role || null,
        userId: session?.user?.id || null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      authTest = { error: "Auth test failed", message };
    }
    
    return NextResponse.json({
      basic: basicTest,
      auth: authTest,
    });
  } catch (error) {
    console.error("Test API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Test API failed", message },
      { status: 500 }
    );
  }
}