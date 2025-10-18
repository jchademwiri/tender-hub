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

interface InvitationEmailProps {
  inviteeEmail?: string;
  inviteeName?: string;
  inviterName?: string;
  inviterEmail?: string;
  role?: string;
  companyName?: string;
  invitationUrl?: string;
  expirationTime?: string;
  invitedDate?: string;
}

const InvitationEmail = (props: InvitationEmailProps) => {
  const {
    inviteeEmail = "hello@jacobc.co.za",
    inviteeName = "there",
    inviterName = "Admin User",
    inviterEmail = "admin@tenderhub.com",
    role = "User",
    companyName = "Tender Hub",
    invitationUrl = "https://tenderhub.com/invite/accept?token=abc123xyz",
    expirationTime = "7 days",
    invitedDate = new Date().toLocaleString('en-US', {
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
        <Preview>You've been invited to join {companyName} as a {role}</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[32px] font-bold text-gray-900 text-center mb-[16px] m-0">
                You're Invited! 🎉
              </Text>

              <Text className="text-[18px] text-gray-700 text-center mb-[32px] m-0">
                Hi {inviteeName}, welcome to the team!
              </Text>

              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px] m-0">
                <strong>{inviterName}</strong> ({inviterEmail}) has invited you to join <strong>{companyName}</strong> as a <strong>{role}</strong>.
              </Text>

              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[32px] m-0">
                Click the button below to accept your invitation and set up your account. Once accepted, you'll have access to all the features and tools available to {role}s.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={invitationUrl}
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-blue-700"
                >
                  Accept Invitation
                </Button>
              </Section>

              <Section className="bg-blue-50 border border-blue-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                  📋 Invitation Details
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                  • <strong>Role:</strong> {role}
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                  • <strong>Invited by:</strong> {inviterName}
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[8px]">
                  • <strong>Company:</strong> {companyName}
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                  • <strong>Invited on:</strong> {invitedDate}
                </Text>
              </Section>

              <Section className="bg-green-50 border border-green-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-green-800 mb-[12px] m-0">
                  🚀 What You Can Do
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                  • Access your personalized dashboard
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                  • Manage tenders and procurement activities
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0 mb-[8px]">
                  • Collaborate with team members
                </Text>
                <Text className="text-[14px] text-green-700 leading-[20px] m-0">
                  • Track performance and analytics
                </Text>
              </Section>

              <Section className="bg-amber-50 border border-amber-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-amber-800 mb-[12px] m-0">
                  🔒 Security Information
                </Text>
                <Text className="text-[14px] text-amber-700 leading-[20px] m-0 mb-[8px]">
                  • This invitation link will expire in {expirationTime} for security reasons
                </Text>
                <Text className="text-[14px] text-amber-700 leading-[20px] m-0 mb-[8px]">
                  • The link can only be used once
                </Text>
                <Text className="text-[14px] text-amber-700 leading-[20px] m-0">
                  • Only accept invitations from people you trust
                </Text>
              </Section>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px] m-0">
                If you're having trouble clicking the button, copy and paste this URL into your browser:{' '}
                <Link href={invitationUrl} className="text-blue-600 underline break-all">
                  {invitationUrl}
                </Link>
              </Text>

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[32px] m-0">
                Questions about this invitation? Contact {inviterName} at{' '}
                <Link href={`mailto:${inviterEmail}`} className="text-blue-600 underline">
                  {inviterEmail}
                </Link>{' '}
                or our support team at{' '}
                <Link href="mailto:support@tenderhub.com" className="text-blue-600 underline">
                  support@tenderhub.com
                </Link>
              </Text>

              {/* Footer */}
              <Section className="border-t border-gray-200 pt-[24px]">
                <Text className="text-[12px] text-gray-500 text-center leading-[16px] m-0 mb-[8px]">
                  This email was sent to {inviteeEmail}
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

InvitationEmail.PreviewProps = {
  inviteeEmail: "hello@jacobc.co.za",
  inviteeName: "Jacob",
  inviterName: "Sarah Johnson",
  inviterEmail: "sarah.johnson@tenderhub.com",
  role: "Manager",
  companyName: "Tender Hub",
  invitationUrl: "https://tenderhub.com/invite/accept?token=abc123xyz789",
  expirationTime: "7 days",
  invitedDate: "October 18, 2025 at 10:35 AM",
};

export default InvitationEmail;