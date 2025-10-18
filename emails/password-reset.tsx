import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Section,
  Text,
  Hr,
  Html,
  Head,
  Preview,
  Tailwind,
  Link,
} from '@react-email/components';

interface PasswordResetEmailProps {
  userEmail?: string;
  resetUrl?: string;
  expirationTime?: string;
  requestTime?: string;
}

const PasswordResetEmail = (props: PasswordResetEmailProps) => {
  const { 
    userEmail = "hello@jacobc.co.za",
    resetUrl = "https://tenderhub.com/reset-password?token=abc123xyz",
    expirationTime = "1 hour",
    requestTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg'
    })
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Reset your Tender Hub password</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[28px] font-bold text-gray-900 text-center mb-[24px] m-0">
                Password Reset Request
              </Text>
              
              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px] m-0">
                We received a request to reset your password for your Tender Hub account ({userEmail}) on {requestTime}.
              </Text>

              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[32px] m-0">
                Click the button below to create a new password. You'll be taken to a secure page where you can set up your new password.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={resetUrl}
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700"
                >
                  Reset Password
                </Button>
              </Section>

              <Section className="bg-amber-50 border border-amber-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-amber-800 mb-[12px] m-0">
                  🔒 Security Information
                </Text>
                <Text className="text-[14px] text-amber-700 leading-[20px] m-0 mb-[8px]">
                  • This password reset link will expire in {expirationTime} for security reasons
                </Text>
                <Text className="text-[14px] text-amber-700 leading-[20px] m-0 mb-[8px]">
                  • The link can only be used once
                </Text>
                <Text className="text-[14px] text-amber-700 leading-[20px] m-0">
                  • Choose a strong password with at least 8 characters
                </Text>
              </Section>

              <Section className="bg-red-50 border border-red-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-red-800 mb-[12px] m-0">
                  ⚠️ Didn't Request This?
                </Text>
                <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[12px]">
                  If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                </Text>
                <Text className="text-[14px] text-red-700 leading-[20px] m-0">
                  However, if you're concerned about account security, contact us immediately at{' '}
                  <Link href="mailto:security@tenderhub.com" className="text-red-600 underline">
                    security@tenderhub.com
                  </Link>
                </Text>
              </Section>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px] m-0">
                If you're having trouble clicking the button, copy and paste this URL into your browser:{' '}
                <Link href={resetUrl} className="text-blue-600 underline break-all">
                  {resetUrl}
                </Link>
              </Text>

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[32px] m-0">
                Need help? Contact our support team at{' '}
                <Link href="mailto:support@tenderhub.com" className="text-blue-600 underline">
                  support@tenderhub.com
                </Link>{' '}
                or call{' '}
                <Link href="tel:+27111234567" className="text-blue-600 underline">
                  +27 11 123 4567
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
                  <Link href="mailto:support@tenderhub.com" className="text-gray-500 underline">
                    support@tenderhub.com
                  </Link>{' '}
                  |{' '}
                  <Link href="https://tenderhub.com/privacy" className="text-gray-500 underline">
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

PasswordResetEmail.PreviewProps = {
  userEmail: "hello@jacobc.co.za",
  resetUrl: "https://tenderhub.com/reset-password?token=abc123xyz789",
  expirationTime: "1 hour",
  requestTime: "October 17, 2025 at 11:17 AM",
};

export default PasswordResetEmail;