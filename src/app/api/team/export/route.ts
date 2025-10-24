import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { checkPermission } from "@/lib/permissions";
import jsPDF from "jspdf";

// POST /api/team/export - Export team member data
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
    const { format = "csv" } = body;

    if (!["csv", "json", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be csv, json, or pdf" },
        { status: 400 },
      );
    }

    // Get all team members
    const teamMembers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        invitedBy: user.invitedBy,
        invitedAt: user.invitedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .orderBy(user.createdAt);

    // Generate export
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      return new NextResponse(JSON.stringify(teamMembers, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="team-members-${timestamp}.json"`,
        },
      });
    }

    if (format === "pdf") {
      // Generate PDF using jsPDF
      const pdfBuffer = await generateMembersPDF(teamMembers, timestamp);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="team-members-${timestamp}.pdf"`,
        },
      });
    }

    // Generate CSV
    const csvContent = generateMembersCSV(teamMembers, timestamp);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="team-members-${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("Team export API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function generateMembersCSV(members: any[], timestamp: string): string {
  const lines: string[] = [];

  // Header
  lines.push(`Team Members Export - ${timestamp}`);
  lines.push(`Total Members: ${members.length}`);
  lines.push("");

  // Column headers
  lines.push(
    "ID,Name,Email,Role,Status,Invited By,Invited At,Created At,Updated At",
  );

  // Data rows
  members.forEach((member) => {
    const invitedBy = member.invitedBy || "";
    const invitedAt = member.invitedAt
      ? new Date(member.invitedAt).toISOString().split("T")[0]
      : "";
    const createdAt = new Date(member.createdAt).toISOString().split("T")[0];
    const updatedAt = new Date(member.updatedAt).toISOString().split("T")[0];

    lines.push(
      [
        member.id,
        `"${member.name}"`,
        member.email,
        member.role,
        member.status,
        invitedBy,
        invitedAt,
        createdAt,
        updatedAt,
      ].join(","),
    );
  });

  return lines.join("\n");
}

async function generateMembersPDF(
  members: any[],
  timestamp: string,
): Promise<Buffer> {
  const doc = new jsPDF();

  // Set up fonts and colors
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);

  // Header
  doc.text("Team Members Report", 20, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${timestamp}`, 20, 40);
  doc.text(`Total Members: ${members.length}`, 20, 50);

  let yPosition = 70;

  // Table headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Name", 20, yPosition);
  doc.text("Email", 80, yPosition);
  doc.text("Role", 140, yPosition);
  doc.text("Status", 170, yPosition);

  yPosition += 10;

  // Table data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  members.forEach((member, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 30;

      // Repeat headers on new page
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Name", 20, yPosition);
      doc.text("Email", 80, yPosition);
      doc.text("Role", 140, yPosition);
      doc.text("Status", 170, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }

    const name =
      member.name.length > 15
        ? member.name.substring(0, 15) + "..."
        : member.name;
    const email =
      member.email.length > 20
        ? member.email.substring(0, 20) + "..."
        : member.email;

    doc.text(name, 20, yPosition);
    doc.text(email, 80, yPosition);
    doc.text(member.role, 140, yPosition);
    doc.text(member.status, 170, yPosition);

    yPosition += 8;
  });

  return Buffer.from(doc.output("arraybuffer"));
}
