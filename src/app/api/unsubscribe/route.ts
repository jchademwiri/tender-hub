import { NextRequest, NextResponse } from "next/server";
import { unsubscribeUser, type UnsubscribeOptions } from "@/lib/email-preferences";
import { AuditLogger } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const emailType = searchParams.get("type");
    const unsubscribeAll = searchParams.get("all") === "true";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Unsubscribe token is required",
          },
        },
        { status: 400 }
      );
    }

    const options: UnsubscribeOptions = {
      emailType: emailType || undefined,
      unsubscribeAll,
      reason: "User clicked unsubscribe link",
    };

    const result = await unsubscribeUser(token, options);

    // Log unsubscribe action
    await AuditLogger.logSystemAccess("anonymous", "email_unsubscribe", {
      metadata: {
        token: token.substring(0, 8) + "...", // Log partial token for security
        emailType,
        unsubscribeAll,
        success: result.success,
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSUBSCRIBE_FAILED",
            message: result.message,
          },
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Failed to process unsubscribe request:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process unsubscribe request",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, emailType, reason, unsubscribeAll } = body;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Unsubscribe token is required",
          },
        },
        { status: 400 }
      );
    }

    const options: UnsubscribeOptions = {
      emailType,
      reason: reason || "User requested unsubscribe",
      unsubscribeAll: unsubscribeAll === true,
    };

    const result = await unsubscribeUser(token, options);

    // Log unsubscribe action
    await AuditLogger.logSystemAccess("anonymous", "email_unsubscribe", {
      metadata: {
        token: token.substring(0, 8) + "...", // Log partial token for security
        emailType,
        reason,
        unsubscribeAll,
        success: result.success,
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSUBSCRIBE_FAILED",
            message: result.message,
          },
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Failed to process unsubscribe request:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process unsubscribe request",
        },
      },
      { status: 500 }
    );
  }
}