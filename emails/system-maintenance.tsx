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

interface SystemMaintenanceEmailProps {
  userEmail?: string;
  userName?: string;
  maintenanceType?: "scheduled" | "emergency" | "completed";
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: string;
  affectedServices?: string[];
  statusPageUrl?: string;
  supportUrl?: string;
  isUrgent?: boolean;
}

const SystemMaintenanceEmail = (props: SystemMaintenanceEmailProps) => {
  const {
    userEmail = "user@example.com",
    userName = "User",
    maintenanceType = "scheduled",
    title = "Scheduled System Maintenance",
    description = "We will be performing routine system maintenance to improve performance and security.",
    startTime = "2025-11-02 02:00 SAST",
    endTime = "2025-11-02 04:00 SAST",
    estimatedDuration = "2 hours",
    affectedServices = ["Web Application", "API Services"],
    statusPageUrl = "https://status.tenderhub.com",
    supportUrl = "https://tenderhub.com/support",
    isUrgent = false,
  } = props;

  const getMaintenanceColor = () => {
    switch (maintenanceType) {
      case "emergency":
        return "red";
      case "completed":
        return "green";
      default:
        return "blue";
    }
  };

  const getMaintenanceEmoji = () => {
    switch (maintenanceType) {
      case "emergency":
        return "🚨";
      case "completed":
        return "✅";
      default:
        return "🔧";
    }
  };

  const color = getMaintenanceColor();
  const emoji = getMaintenanceEmoji();

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          {title} - Tender Hub System Update
        </Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[32px] font-bold text-gray-900 text-center mb-[16px] m-0">
                {title} {emoji}
              </Text>

              <Text className="text-[18px] text-gray-700 text-center mb-[32px] m-0">
                Hi {userName}, we have an important system update.
              </Text>

              {isUrgent && (
                <Section className="bg-red-50 border border-red-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-red-800 mb-[12px] m-0">
                    🚨 URGENT NOTICE
                  </Text>
                  <Text className="text-[14px] text-red-700 leading-[20px] m-0">
                    This is an urgent system maintenance that may affect your access to Tender Hub services.
                  </Text>
                </Section>
              )}

              <Section className={`bg-${color}-50 border border-${color}-200 rounded-[8px] p-[20px] mb-[32px]`}>
                <Text className={`text-[16px] font-semibold text-${color}-800 mb-[12px] m-0`}>
                  📋 Maintenance Details
                </Text>
                <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                  • <strong>Type:</strong> {maintenanceType.charAt(0).toUpperCase() + maintenanceType.slice(1)} Maintenance
                </Text>
                {startTime && (
                  <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                    • <strong>Start Time:</strong> {startTime}
                  </Text>
                )}
                {endTime && (
                  <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0 mb-[8px]`}>
                    • <strong>End Time:</strong> {endTime}
                  </Text>
                )}
                {estimatedDuration && (
                  <Text className={`text-[14px] text-${color}-700 leading-[20px] m-0`}>
                    • <strong>Duration:</strong> {estimatedDuration}
                  </Text>
                )}
              </Section>

              <Section className="bg-gray-50 border border-gray-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-gray-800 mb-[12px] m-0">
                  📝 What's Happening?
                </Text>
                <Text className="text-[14px] text-gray-700 leading-[20px] m-0">
                  {description}
                </Text>
              </Section>

              {affectedServices && affectedServices.length > 0 && (
                <Section className="bg-amber-50 border border-amber-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-amber-800 mb-[12px] m-0">
                    ⚠️ Affected Services
                  </Text>
                  {affectedServices.map((service) => (
                    <Text key={service} className="text-[14px] text-amber-700 leading-[20px] m-0 mb-[8px]">
                      • {service}
                    </Text>
                  ))}
                </Section>
              )}

              {maintenanceType === "completed" ? (
                <Section className="bg-green-50 border border-green-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-green-800 mb-[12px] m-0">
                    🎉 Maintenance Complete
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                    • All systems are now fully operational
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                    • Performance improvements have been applied
                  </Text>
                  <Text className="text-[14px] text-green-700 leading-[20px] m-0">
                    • Thank you for your patience during the maintenance window
                  </Text>
                </Section>
              ) : (
                <Section className="bg-blue-50 border border-blue-200 rounded-[8px] p-[20px] mb-[32px]">
                  <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                    💡 What You Need to Know
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                    • Services may be temporarily unavailable during maintenance
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                    • Any work in progress should be saved before the maintenance window
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                    • We'll send an update when maintenance is complete
                  </Text>
                  <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                    • Check our status page for real-time updates
                  </Text>
                </Section>
              )}

              <Section className="text-center mb-[32px]">
                <Button
                  href={statusPageUrl}
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700 mr-[16px]"
                >
                  Status Page
                </Button>
                <Button
                  href={supportUrl}
                  className="bg-gray-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-gray-700"
                >
                  Get Support
                </Button>
              </Section>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px] m-0">
                We apologize for any inconvenience this may cause. If you have urgent questions, please contact our support team at{" "}
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
                    href="https://status.tenderhub.com"
                    className="text-gray-500 underline"
                  >
                    System Status
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

SystemMaintenanceEmail.PreviewProps = {
  userEmail: "john.doe@example.com",
  userName: "John Doe",
  maintenanceType: "scheduled" as const,
  title: "Scheduled System Maintenance",
  description: "We will be performing routine system maintenance to improve performance, security, and add new features to enhance your Tender Hub experience.",
  startTime: "2025-11-02 02:00 SAST",
  endTime: "2025-11-02 04:00 SAST",
  estimatedDuration: "2 hours",
  affectedServices: ["Web Application", "API Services", "Email Notifications"],
  statusPageUrl: "https://status.tenderhub.com",
  supportUrl: "https://tenderhub.com/support",
  isUrgent: false,
};

export default SystemMaintenanceEmail;