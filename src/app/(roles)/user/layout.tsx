import type { Metadata } from "next";
import DashboardNav from "@/components/dashboard-nav";
import { requireAuth } from "@/lib/auth-utils";
import { ErrorBoundary } from "@/components/error-boundary";

/**
 * TODO: User Role Implementation Checklist
 *
 * LAYOUT & AUTHENTICATION:
 * [ ] Implement requireAuth middleware for basic authentication
 * [ ] Add user activity tracking and session management
 * [ ] Implement user-specific security measures
 * [ ] Add user preferences and customization options
 * [ ] Implement user session timeout handling
 *
 * USER DASHBOARD FEATURES:
 * [ ] Personal profile and account management
 * [ ] Activity history and usage statistics
 * [ ] Personal analytics and insights
 * [ ] Notification preferences and alerts
 * [ ] Quick access to frequently used features
 *
 * USER WORKFLOWS:
 * [ ] Profile update request system
 * [ ] Personal data export and privacy controls
 * [ ] Account security and password management
 * [ ] Communication preferences and notifications
 * [ ] Help and support access
 *
 * USER NAVIGATION:
 * [ ] Personal profile and settings access
 * [ ] Activity history and usage stats
 * [ ] Help and support resources
 * [ ] Account management tools
 * [ ] Quick actions for common tasks
 */

export const metadata: Metadata = {
  title: "Tender Hub | User Dashboard",
  description: "Personal workspace and account management",
};

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Enable user authentication check
  // await requireAuth();

  return (
    <ErrorBoundary>
      <section className="antialiased py-20 overflow-x-hidden">
        <DashboardNav />
        <section>
          {children}
        </section>
      </section>
    </ErrorBoundary>
  );
}