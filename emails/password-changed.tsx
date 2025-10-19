import {
  Body,
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

interface PasswordChangedEmailProps {
  userEmail?: string;
  changeDate?: string;
}

const PasswordChangedEmail = (props: PasswordChangedEmailProps) => {
  const {
    userEmail = "hello@jacobc.co.za",
    changeDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Johannesburg",
    }),
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Your Tender Hub password has been changed</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[28px] font-bold text-gray-900 text-center mb-[24px] m-0">
                Password Changed
              </Text>

              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px] m-0">
                Your Tender Hub account password was recently changed on{" "}
                {changeDate}.
              </Text>

              <Section className="bg-red-50 border-l-[4px] border-red-400 p-[20px] mb-[32px] rounded-[4px]">
                <Text className="text-[18px] font-semibold text-red-800 mb-[12px] m-0">
                  🔒 Security Notice
                </Text>
                <Text className="text-[14px] text-red-700 leading-[22px] m-0">
                  If you made this change, you can disregard this email. If you
                  didn't change your password, please contact our support team
                  immediately as your account may be compromised.
                </Text>
              </Section>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px] m-0">
                For your security, this notification was sent to all email
                addresses associated with your account.
              </Text>

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[32px] m-0">
                If you need help or believe this was unauthorized, please
                contact us immediately at{" "}
                <Link
                  href="mailto:support@tenderhub.com"
                  className="text-blue-600 underline"
                >
                  support@tenderhub.com
                </Link>{" "}
                or call{" "}
                <Link
                  href="tel:+27111234567"
                  className="text-blue-600 underline"
                >
                  +27 11 123 4567
                </Link>
                .
              </Text>

              {/* Additional Security Tips */}
              <Section className="bg-blue-50 p-[20px] rounded-[8px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                  Security Tips
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                  • Use a strong, unique password for your Tender Hub account
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                  • Enable two-factor authentication for added security
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                  • Never share your login credentials with anyone
                </Text>
              </Section>

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
                    href="https://tenderhub.com/unsubscribe"
                    className="text-gray-500 underline"
                  >
                    Unsubscribe
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

PasswordChangedEmail.PreviewProps = {
  userEmail: "hello@jacobc.co.za",
  changeDate: "October 17, 2025 at 11:10 AM",
};

export default PasswordChangedEmail;
