import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { checkPermission } from "@/lib/permissions";
import { InvitationAnalyticsCache } from "@/lib/invitation-analytics-cache";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function getPeriodLabel(period: string): string {
  switch (period) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "1y":
      return "Last year";
    default:
      return "Last 30 days";
  }
}

// POST /api/team/analytics/export - Export analytics data
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get full user data from database
    const fullUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (fullUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPermissions = checkPermission(fullUser[0]);
    if (!userPermissions.hasRoleOrHigher("manager")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { format = "csv", period = "30d", includeActivity = false } = body;

    if (!["csv", "json", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be csv, json, or pdf" },
        { status: 400 },
      );
    }

    // Get analytics data
    const analyticsResponse = await fetch(
      `${request.nextUrl.origin}/api/team/analytics?period=${period}&includeActivity=${includeActivity}`,
      {
        headers: {
          ...request.headers,
          "x-internal-request": "true", // Mark as internal request
        },
      },
    );

    if (!analyticsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 },
      );
    }

    const analyticsData = await analyticsResponse.json();

    // Generate export
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      return new NextResponse(JSON.stringify(analyticsData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="team-analytics-${timestamp}.json"`,
        },
      });
    }

    if (format === "pdf") {
      // Generate PDF using jsPDF
      const pdfBuffer = await generatePDF(analyticsData, timestamp, period);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="team-analytics-${timestamp}.pdf"`,
        },
      });
    }

    // Generate CSV
    const csvContent = generateCSV(analyticsData, timestamp, period);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="team-analytics-${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("Team analytics export API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function generateCSV(
  analyticsData: any,
  timestamp: string,
  period: string,
): string {
  const lines: string[] = [];

  // Header
  lines.push(`Team Analytics Export - ${timestamp}`);
  lines.push(`Period: ${getPeriodLabel(period)}`);
  lines.push("");

  // Overview section
  lines.push("OVERVIEW METRICS");
  lines.push("Metric,Value");
  lines.push(`Total Members,${analyticsData.overview.totalMembers}`);
  lines.push(`Active Members,${analyticsData.overview.activeMembers}`);
  lines.push(`Suspended Members,${analyticsData.overview.suspendedMembers}`);
  lines.push(`Pending Members,${analyticsData.overview.pendingMembers}`);
  lines.push(`Conversion Rate (%),${analyticsData.overview.conversionRate}`);
  lines.push("");

  // Role distribution
  lines.push("ROLE DISTRIBUTION");
  lines.push("Role,Count,Percentage (%)");
  analyticsData.roleDistribution.forEach((role: any) => {
    lines.push(`${role.role},${role.count},${role.percentage}`);
  });
  lines.push("");

  // Activity trends
  lines.push("ACTIVITY TRENDS");
  lines.push("Date,New Members,Active Members,Suspended Members");
  analyticsData.activityTrends.forEach((trend: any) => {
    lines.push(
      `${trend.date},${trend.newMembers},${trend.activeMembers},${trend.suspendedMembers}`,
    );
  });
  lines.push("");

  // Invitation metrics
  lines.push("INVITATION METRICS");
  lines.push("Metric,Value");
  lines.push(
    `Total Invitations,${analyticsData.invitationMetrics.totalInvitations}`,
  );
  lines.push(
    `Accepted Invitations,${analyticsData.invitationMetrics.acceptedInvitations}`,
  );
  lines.push(
    `Pending Invitations,${analyticsData.invitationMetrics.pendingInvitations}`,
  );
  lines.push(
    `Expired Invitations,${analyticsData.invitationMetrics.expiredInvitations}`,
  );
  lines.push(
    `Cancelled Invitations,${analyticsData.invitationMetrics.cancelledInvitations}`,
  );
  lines.push(
    `Average Response Time (hours),${analyticsData.invitationMetrics.averageResponseTime}`,
  );
  lines.push(
    `Conversion Rate (%),${analyticsData.invitationMetrics.conversionRate}`,
  );
  lines.push("");

  // Recent activity (if included)
  if (analyticsData.recentActivity && analyticsData.recentActivity.length > 0) {
    lines.push("RECENT ACTIVITY");
    lines.push("Type,Description,Timestamp");
    analyticsData.recentActivity.forEach((activity: any) => {
      lines.push(
        `${activity.type},"${activity.description}",${activity.timestamp}`,
      );
    });
  }

  return lines.join("\n");
}

async function generatePDF(
  analyticsData: any,
  timestamp: string,
  period: string,
): Promise<Buffer> {
  const doc = new jsPDF();

  // Set up fonts and colors
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);

  // Header
  doc.text("Team Analytics Report", 20, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${timestamp}`, 20, 40);
  doc.text(`Period: ${getPeriodLabel(period)}`, 20, 50);

  let yPosition = 70;

  // Overview Metrics
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Overview Metrics", 20, yPosition);
  yPosition += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const overviewMetrics = [
    `Total Members: ${analyticsData.overview.totalMembers}`,
    `Active Members: ${analyticsData.overview.activeMembers}`,
    `Suspended Members: ${analyticsData.overview.suspendedMembers}`,
    `Pending Members: ${analyticsData.overview.pendingMembers}`,
    `Conversion Rate: ${analyticsData.overview.conversionRate}%`,
  ];

  overviewMetrics.forEach((metric) => {
    doc.text(metric, 30, yPosition);
    yPosition += 10;
  });

  yPosition += 10;

  // Role Distribution
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 30;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Role Distribution", 20, yPosition);
  yPosition += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  analyticsData.roleDistribution.forEach((role: any) => {
    doc.text(
      `${role.role}: ${role.count} (${role.percentage}%)`,
      30,
      yPosition,
    );
    yPosition += 10;
  });

  yPosition += 10;

  // Invitation Metrics
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 30;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Invitation Metrics", 20, yPosition);
  yPosition += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const invitationMetrics = [
    `Total Invitations: ${analyticsData.invitationMetrics.totalInvitations}`,
    `Accepted Invitations: ${analyticsData.invitationMetrics.acceptedInvitations}`,
    `Pending Invitations: ${analyticsData.invitationMetrics.pendingInvitations}`,
    `Conversion Rate: ${analyticsData.invitationMetrics.conversionRate}%`,
  ];

  invitationMetrics.forEach((metric) => {
    doc.text(metric, 30, yPosition);
    yPosition += 10;
  });

  // Activity Trends (if available)
  if (analyticsData.activityTrends && analyticsData.activityTrends.length > 0) {
    yPosition += 10;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Activity Trends", 20, yPosition);
    yPosition += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    analyticsData.activityTrends.slice(-10).forEach((trend: any) => {
      doc.text(
        `${trend.date}: New: ${trend.newMembers}, Active: ${trend.activeMembers}, Suspended: ${trend.suspendedMembers}`,
        30,
        yPosition,
      );
      yPosition += 8;
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function generateHTML(analyticsData: any, timestamp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Team Analytics Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Team Analytics Report</h1>
        <p>Generated on ${timestamp}</p>
    </div>

    <div class="section">
        <h2>Overview Metrics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-title">Total Members</div>
                <div class="metric-value">${analyticsData.overview.totalMembers}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Active Members</div>
                <div class="metric-value">${analyticsData.overview.activeMembers}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Suspended Members</div>
                <div class="metric-value">${analyticsData.overview.suspendedMembers}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Conversion Rate</div>
                <div class="metric-value">${analyticsData.overview.conversionRate}%</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Role Distribution</h2>
        <table>
            <thead>
                <tr>
                    <th>Role</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${analyticsData.roleDistribution
                  .map(
                    (role: any) => `
                    <tr>
                        <td>${role.role}</td>
                        <td>${role.count}</td>
                        <td>${role.percentage}%</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Invitation Metrics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-title">Total Invitations</div>
                <div class="metric-value">${analyticsData.invitationMetrics.totalInvitations}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Accepted</div>
                <div class="metric-value">${analyticsData.invitationMetrics.acceptedInvitations}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Pending</div>
                <div class="metric-value">${analyticsData.invitationMetrics.pendingInvitations}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Conversion Rate</div>
                <div class="metric-value">${analyticsData.invitationMetrics.conversionRate}%</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}
