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

interface AccountDeletionEmailProps {
  userEmail?: string;
  confirmationUrl?: string;
  expirationTime?: string;
}

const AccountDeletionEmail = (props: AccountDeletionEmailProps) => {
  const {
    userEmail = "hello@jacobc.co.za",
    confirmationUrl = "https://tenderhub.com/confirm-deletion?token=abc123xyz",
    expirationTime = "24 hours",
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Confirm your Tender Hub account deletion request</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto">
            <Section className="p-[40px]">
              <Text className="text-[28px] font-bold text-gray-900 text-center mb-[24px] m-0">
                Account Deletion Request
              </Text>

              <Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px] m-0">
                We received a request to permanently delete your Tender Hub
                account ({userEmail}). This action will remove all your data and
                cannot be undone.
              </Text>

              <Section className="bg-red-50 border border-red-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[18px] font-semibold text-red-800 mb-[12px] m-0">
                  ⚠️ This action is permanent and cannot be reversed.
                </Text>
                <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[12px]">
                  Once confirmed, the following will be permanently deleted:
                </Text>
                <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                  • Your profile and account information
                </Text>
                <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                  • All tender applications and submissions
                </Text>
                <Text className="text-[14px] text-red-700 leading-[20px] m-0 mb-[8px]">
                  • Saved searches and preferences
                </Text>
                <Text className="text-[14px] text-red-700 leading-[20px] m-0">
                  • Communication history and documents
                </Text>
              </Section>

              <Section className="text-center mb-[32px]">
                <Button
                  href={confirmationUrl}
                  className="bg-red-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border hover:bg-red-700"
                >
                  Confirm Account Deletion
                </Button>
              </Section>

              <Section className="bg-blue-50 border border-blue-200 rounded-[8px] p-[20px] mb-[32px]">
                <Text className="text-[16px] font-semibold text-blue-800 mb-[12px] m-0">
                  💡 Need Help Instead?
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0 mb-[12px]">
                  If you're experiencing issues with your account, our support
                  team can help:
                </Text>
                <Text className="text-[14px] text-blue-700 leading-[20px] m-0">
                  Contact us at{" "}
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
                If you did not request account deletion, please ignore this
                email and your account will remain active. This confirmation
                link will expire in {expirationTime}.
              </Text>

              <Text className="text-[14px] text-gray-600 leading-[20px] mb-[32px] m-0">
                If you're having trouble clicking the button, copy and paste
                this URL into your browser:{" "}
                <Link
                  href={confirmationUrl}
                  className="text-blue-600 underline break-all"
                >
                  {confirmationUrl}
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

AccountDeletionEmail.PreviewProps = {
  userEmail: "hello@jacobc.co.za",
  confirmationUrl: "https://tenderhub.com/confirm-deletion?token=abc123xyz789",
  expirationTime: "24 hours",
};

export default AccountDeletionEmail;
