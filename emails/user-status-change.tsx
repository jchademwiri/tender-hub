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

interface UserStatusChangeEmailProps {
  userEmail?: string;
  userName?: string;
  adminName?: string;
  adminEmail?: string;
  statusChange?: "activated" | "suspended" | "role_changed" | "permissions_updated";
  oldStatus?: string;
  newStatus?: string;
  oldRole?: string;
  newRole?: string;
  reason?: string;
  effectiveDate?: string;
  dashboardUrl?: string;
  supportUrl?: string;
  isTemporary?: boolean;
  reviewDate?: string;
}

const UserStatusChangeEmail = (props: UserStatusChangeEmailProps) => {
  const {
    userEmail = "user@example.com",
    userName = "User",
    adminName = "Admin",
    adminEmail = "admin@tenderhub.com",
    statusChange = "activated",
    oldStatus = "pending",
    newStatus = "active",
    oldRole = "user",
    newRole = "manager",
    reason = "",
    effectiveDate = new Date().toLocaleDateString("en-ZA"),
    dashboardUrl = "https://tenderhub.com/dashboard",
    supportUrl = "https://tenderhub.com/support",
    isTemporary = false,
    reviewDate = "",
  } = props;

  const getStatusColor = () => {
    switch (statusChange) {
      case "activated":
        return "green";
      case "suspended":
        return "red";
      case "role_changed":
      case "permissions_updated":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusEmoji = () => {
    switch (statusChange) {
      case "activated":
        return "✅";
      case "suspended":
        return "⚠️";
      case "role_changed":
        return "🔄";
      case "permissions_updated":
        return "🔐";
      default:
        return "📝";
    }
  };

  const getStatusTitle = () => {
    switch (statusChange) {
      case "activated":
        return "Account Activated";
      case "suspended":
        return "Account Suspended";
      case "role_changed":
        return "Role Updated";
      case "permissions_updated":
        return "Permissions Updated";
      default:
        return "Account Updated";
    }
  };

  const color = getStatusColor();
  const emoji = getStatusEmoji();
  const title = getStatusTitle();

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          {title} - Your Tender Hub account has been updated
        </Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[32px] font-bold text-gray-900 text-center mb-[16px] m-0">
                {title} {emoji}
              </Text>

              <Text className="text-[18px] text-gray-700 text-center mb-[32px] m-0">
                Hi {userName}, your account status has been updated.
              </Text>

              <Section className={`bg-${color}-50 border border-${color}-200 rounded-[8px] p-[20px] mb-[32px]`}>
                <Text className={`text-[16px] font-semibold text-${color}-800 mb-[12px] m-0`}>
                  📋 Status Change Details
                </Text>
                
                {statusChange === "role_changed" && (
                  <>
                    <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                      • <strong>Previous Role:</strong> {oldRole}
                    </Text>
                    <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                      • <strong>New Role:</strong> {newRole}
                    </Text>
                  </>
                )}
                
                {(statusChange === "activated" || statusChange === "suspended") && (
                  <>
                    <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                      • <strong>Previous Status:</strong> {oldStatus}
                    </Text>
                    <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                      • <strong>New Status:</strong> {newStatus}
                    </Text>
                  </>
                )}
                
                <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                  • <strong>Effective Date:</strong> {effectiveDate}
                </Text>
                <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                  • <strong>Updated by:</strong> {adminName}
                </Text>
                
                {isTemporary && reviewDate && (
                  <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0`}>
                    • <strong>Review Date:</strong> {reviewDate}
                  </Text>
                )}
              </Section>

              {reason && (
                <Section className="bg-blue-50 border border-blue-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                    💬 Reason for Change
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                    {reason}
                  </Text>
                </Section>
              )}

              {statusChange === "activated" && (
                <Section className="bg-green-50 border border-green-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-green-800 mb-[12px] m-0">
                    🎉 Welcome to Tender Hub!
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                    • Your account is now fully activated
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                    • You can access all features available to your role
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                    • Start exploring tender opportunities in your dashboard
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0">
                    • Set up your preferences and bookmarks
                  </Text>
                </Section>
              )}

              {statusChange === "suspended" && (
                <Section className="bg-red-50 border border-red-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-red-800 mb-[12px] m-0">
                    ⚠️ Account Suspended
                  </Text>
                  <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                    • Your account access has been temporarily suspended
                  </Text>
                  <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                    • You will not be able to log in during this period
                  </Text>
                  <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                    • Contact support if you believe this is an error
                  </Text>
                  {isTemporary && reviewDate && (
                    <Text className="text-[14px] text-red-700 leading-[20px] m-0">
                      • This suspension will be reviewed on {reviewDate}
                    </Text>
                  )}
                </Section>
              )}

              {statusChange === "role_changed" && (
                <Section className="bg-blue-50 border border-blue-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                    🔄 Role Updated
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                    • Your role has been updated from {oldRole} to {newRole}
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                    • You now have access to new features and permissions
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                    • Check your dashboard to see the updated interface
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                    • Contact support if you need help with new features
                  </Text>
                </Section>
              )}

              {statusChange === "permissions_updated" && (
                <Section className="bg-purple-50 border border-purple-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-purple-800 mb-[12px] m-0">
                    🔐 Permissions Updated
                  </Text>
                  <Text className="text-[14px] text-purple-700 leading-[20px] m-0 mb-[8px]">
                    • Your account permissions have been updated
                  </Text>
                  <Text className="text-[14px] text-purple-700 leading-[20px] m-0 mb-[8px]">
                    • Some features may now be available or restricted
                  </Text>
                  <Text className="text-[14px] text-purple-700 leading-[20px] m-0 mb-[8px]">
                    • Log in to see your updated access level
                  </Text>
                  <Text className="text-[14px] text-purple-700 leading-[20px] m-0">
                    • Contact your administrator for more details
                  </Text>
                </Section>
              )}

              {statusChange !== "suspended" && (
                <Section className="text-center mb-[32px]">
                  <Button
                    href={dashboardUrl}
                    className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700 mr-[16px]"
                  >
                    View Dashboard
                  </Button>
                  <Button
                    href={supportUrl}
                    className="bg-gray-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-gray-700"
                  >
                    Get Support
                  </Button>
                </Section>
              )}

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px] m-0">
                Questions about this change? Contact {adminName} at{" "}
                <Link
                  href={`mailto:${adminEmail}`}
                  className="text-blue-600 underline"
                >
                  {adminEmail}
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

UserStatusChangeEmail.PreviewProps = {
  userEmail: "john.doe@example.com",
  userName: "John Doe",
  adminName: "Sarah Johnson",
  adminEmail: "sarah.johnson@tenderhub.com",
  statusChange: "role_changed" as const,
  oldRole: "user",
  newRole: "manager",
  reason: "Promoted to manager role based on excellent performance and leadership qualities.",
  effectiveDate: "2025-11-01",
  dashboardUrl: "https://tenderhub.com/dashboard",
  supportUrl: "https://tenderhub.com/support",
  isTemporary: false,
};

export default UserStatusChangeEmail;