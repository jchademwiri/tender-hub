import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { AuditLogger } from "@/lib/audit-logger";

const _resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(_request: NextRequest) {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_CONFIG_MISSING",
            message: "Email service configuration missing",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );
    }

    // Test email service connectivity
    const startTime = Date.now();
    
    try {
      // Use Resend's domains endpoint to test connectivity
      const response = await fetch("https://api.resend.com/domains", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Resend API returned ${response.status}`);
      }

      // Log successful health check
      await AuditLogger.logSystemAccess("system", "email_health_check", {
        metadata: {
          status: "healthy",
          responseTime,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        status: "healthy",
        service: "resend",
        responseTime,
        timestamp: new Date().toISOString(),
      });

    } catch (apiError) {
      // Log failed health check
      await AuditLogger.logSystemAccess("system", "email_health_check", {
        metadata: {
          status: "unhealthy",
          error: apiError instanceof Error ? apiError.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_SERVICE_UNAVAILABLE",
            message: "Email service is not responding",
            details: apiError instanceof Error ? apiError.message : "Unknown error",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error("Email health check failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "HEALTH_CHECK_ERROR",
          message: "Health check failed",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}