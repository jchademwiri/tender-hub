import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface ApprovalDecisionEmailProps {
  userEmail?: string;
  userName?: string;
  managerName?: string;
  managerEmail?: string;
  requestType?: string;
  decision?: "approved" | "rejected";
  reason?: string;
  conditions?: string[];
  dashboardUrl?: string;
  requestDate?: string;
  decisionDate?: string;
}

const ApprovalDecisionEmail = (props: ApprovalDecisionEmailProps) => {
  const {
    userEmail = "user@example.com",
    userName = "User",
    managerName = "Manager",
    managerEmail = "manager@tenderhub.com",
    requestType = "Profile Update",
    decision = "approved",
    reason = "",
    conditions = [],
    dashboardUrl = "https://tenderhub.com/dashboard",
    requestDate = new Date().toLocaleDateString("en-ZA"),
    decisionDate = new Date().toLocaleDateString("en-ZA"),
  } = props;

  const isApproved = decision === "approved";
  const statusColor = isApproved ? "green" : "red";
  const statusEmoji = isApproved ? "✅" : "❌";

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          Your {requestType} request has been {decision}
        </Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[32px] font-bold text-gray-900 text-center mb-[16px] m-0">
                Request {isApproved ? "Approved" : "Rejected"} {statusEmoji}
              </Text>

              <Text className="text-[18px] text-gray-700 text-center mb-[32px] m-0">
                Hi {userName}, we have an update on your request.
              </Text>

              <Section className={`bg-${statusColor}-50 border border-${statusColor}-200 rounded-[8px] p-[20px] mb-[32px]`}>
                <Text className={`text-[16px] font-semibold text-${statusColor}-800 mb-[12px] m-0`}>
                  📋 Request Details
                </Text>
                <Text className={`text-[14px] text-${statusColor}-700 leading-[20px] m-0 mb-[8px]`}>
                  • <strong>Request Type:</strong> {requestType}
                </Text>
                <Text className={`text-[14px] text-${statusColor}-700 leading-[20px] m-0 mb-[8px]`}>
                  • <strong>Submitted:</strong> {requestDate}
                </Text>
                <Text className={`text-[14px] text-${statusColor}-700 leading-[20px] m-0 mb-[8px]`}>
                  • <strong>Decision Date:</strong> {decisionDate}
                </Text>
                <Text className={`text-[14px] text-${statusColor}-700 leading-[20px] m-0 mb-[8px]`}>
                  • <strong>Reviewed by:</strong> {managerName}
                </Text>
                <Text className={`text-[14px] text-${statusColor}-700 leading-[20px] m-0`}>
                  • <strong>Status:</strong> {isApproved ? "Approved" : "Rejected"}
                </Text>
              </Section>

              {reason && (
                <Section className="bg-blue-50 border border-blue-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                    💬 {isApproved ? "Manager's Notes" : "Reason for Rejection"}
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                    {reason}
                  </Text>
                </Section>
              )}

              {conditions && conditions.length > 0 && (
                <Section className="bg-amber-50 border border-amber-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-amber-800 mb-[12px] m-0">
                    ⚠️ Conditions & Requirements
                  </Text>
                  {conditions.map((condition) => (
                    <Text key={condition} className="text-[14px] text-amber-700 leading-[20px] m-0 mb-[8px]">
                      • {condition}
                    </Text>
                  ))}
                </Section>
              )}

              {isApproved ? (
                <Section className="bg-green-50 border border-green-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-green-800 mb-[12px] m-0">
                    🎉 What's Next?
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                    • Your changes have been applied to your account
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                    • You can now access the updated features
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0">
                    • Check your dashboard for the latest updates
                  </Text>
                </Section>
              ) : (
                <Section className="bg-red-50 border border-red-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-red-800 mb-[12px] m-0">
                    🔄 What's Next?
                  </Text>
                  <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                    • Review the reason for rejection above
                  </Text>
                  <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                    • Make necessary adjustments to your request
                  </Text>
                  <Text className="text-[14px] text-red-700 leading-[20px] m-0">
                    • Submit a new request when ready
                  </Text>
                </Section>
              )}

              <Section className="text-center mb-[32px]">
                <Button
                  href={dashboardUrl}
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700"
                >
                  View Dashboard
                </Button>
              </Section>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px] m-0">
                Questions about this decision? Contact {managerName} at{" "}
                <Link
                  href={`mailto:${managerEmail}`}
                  className="text-blue-600 underline"
                >
                  {managerEmail}
                </Link>{" "}
                or our support team at{" "}
                <Link
                  href="mailto:support@tenderhub.com"
                  className="text-blue-600 underline"
                >
                  support@tenderhub.com
                </Link>
              </Text>

              {/* Footer */}
              <Section className="border-t border-gray-200 pt-[24px]">
                <Text className="text-[12px] text-gray-500 text-center leading-[16px] m-0 mb-[8px]">
                  This email was sent to {userEmail}
                </Text>
                <Text className="text-[12px] text-gray-500 text-center leading-[16px] m-0 mb-[8px]">
                  Tender Hub, 123 Business District, Sandton, Johannesburg, 2196
                </Text>
                <Text className="text-[12px] text-gray-500 text-center leading-[16px] m-0 mb-[8px]">
                  <Link
                    href="mailto:support@tenderhub.com"
                    className="text-gray-500 underline"
                  >
                    support@tenderhub.com
                  </Link>{" "}
                  |{" "}
                  <Link
                    href="https://tenderhub.com/privacy"
                    className="text-gray-500 underline"
                  >
                    Privacy Policy
                  </Link>
                </Text>
                <Text className="text-[12px] text-gray-500 text-center leading-[16px] m-0">
                  © {new Date().getFullYear()} Tender Hub. All rights reserved.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ApprovalDecisionEmail.PreviewProps = {
  userEmail: "john.doe@example.com",
  userName: "John Doe",
  managerName: "Sarah Johnson",
  managerEmail: "sarah.johnson@tenderhub.com",
  requestType: "Profile Update",
  decision: "approved" as const,
  reason: "All required information has been provided and verified.",
  conditions: ["Please update your profile picture within 7 days"],
  dashboardUrl: "https://tenderhub.com/dashboard",
  requestDate: "2025-11-01",
  decisionDate: "2025-11-01",
};

export default ApprovalDecisionEmail;