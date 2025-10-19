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

interface EmailVerificationEmailProps {
  userEmail?: string;
  userName?: string;
  verificationUrl?: string;
  expirationTime?: string;
}

const EmailVerificationEmail = (props: EmailVerificationEmailProps) => {
  const {
    userEmail = "hello@jacobc.co.za",
    userName = "there",
    verificationUrl = "https://tenderhub.com/verify-email?token=abc123xyz",
    expirationTime = "1 hour",
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          Welcome to Tender Hub! Please verify your email address
        </Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[32px] font-bold text-gray-900 text-center mb-[16px] m-0">
                Welcome to Tender Hub! 🎉
              </Text>

              <Text className="text-[18px] text-gray-700 text-center mb-[32px] m-0">
                Hi {userName}, we're excited to have you on board!
              </Text>

              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[32px] m-0">
                Click the button below to verify your email address and activate
                your account. Once verified, you'll have full access to discover
                and apply for tenders across South Africa.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={verificationUrl}
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700"
                >
                  Verify Email Address
                </Button>
              </Section>

              <Section className="bg-green-50 border border-green-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-green-800 mb-[12px] m-0">
                  🚀 What's Next?
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                  • Complete your profile to increase tender match accuracy
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                  • Set up tender alerts for opportunities in your industry
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                  • Browse thousands of active tenders
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0">
                  • Connect with procurement professionals
                </Text>
              </Section>

              <Section className="bg-blue-50 border border-blue-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                  💡 Need Help Getting Started?
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[12px]">
                  Our support team is here to help you make the most of Tender
                  Hub:
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                  Email us at{" "}
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
                </Text>
              </Section>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px] m-0">
                This verification link will expire in {expirationTime}. If you
                didn't create an account with Tender Hub, you can safely ignore
                this email.
              </Text>

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[32px] m-0">
                If you're having trouble clicking the button, copy and paste
                this URL into your browser:{" "}
                <Link
                  href={verificationUrl}
                  className="text-blue-600 underline break-all"
                >
                  {verificationUrl}
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

EmailVerificationEmail.PreviewProps = {
  userEmail: "hello@jacobc.co.za",
  userName: "Jacob",
  verificationUrl: "https://tenderhub.com/verify-email?token=abc123xyz789",
  expirationTime: "1 hour",
};

export default EmailVerificationEmail;
