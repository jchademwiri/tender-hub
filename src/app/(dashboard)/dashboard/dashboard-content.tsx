"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingTour } from "@/components/onboarding-tour";
import { formatUserRole } from "@/lib/auth-utils-client";
import { Users, Building, FileText, Settings, CheckCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

interface Publisher {
  id: string;
  name: string;
  website?: string | null;
  provinceName?: string | null;
  createdAt: Date | string;
}

interface DashboardContentProps {
  user: User;
  provinceCount: number;
  publisherCount: number;
  recentPublishers: Publisher[];
}

export function DashboardContent({
  user,
  provinceCount,
  publisherCount,
  recentPublishers,
}: DashboardContentProps) {
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const onboardingStatus = localStorage.getItem(`onboarding-completed-${user.id}`);
    if (!onboardingStatus) {
      setShowTour(true);
      setTourCompleted(false);
    } else if (onboardingStatus === "true") {
      setTourCompleted(true);
      setShowTour(false);
    } else {
      // onboardingStatus === "skipped"
      setTourCompleted(false);
      setShowTour(false);
    }
  }, [user.id]);

  const handleTourComplete = () => {
    localStorage.setItem(`onboarding-completed-${user.id}`, "true");
    setTourCompleted(true);
    setShowTour(false);
  };

  const handleTourSkip = () => {
    localStorage.setItem(`onboarding-completed-${user.id}`, "skipped");
    setTourCompleted(false);
    setShowTour(false);
  };

  const getRoleSpecificContent = () => {
    switch (user.role) {
      case "admin":
        return {
          title: "Administrator Dashboard",
          description: "Manage users, invitations, and system-wide settings",
          features: [
            { icon: Users, label: "Team Management", href: "/admin/team" },
            {
              icon: Settings,
              label: "Invitations",
              href: "/admin/invitations",
            },
            { icon: FileText, label: "System Reports", href: "/admin" },
          ],
        };
      case "manager":
        return {
          title: "Manager Dashboard",
          description: "Oversee team members and approve requests",
          features: [
            { icon: Users, label: "Team Overview", href: "/manager/team" },
            { icon: CheckCircle, label: "Approvals", href: "/manager" },
            { icon: FileText, label: "Reports", href: "/manager" },
          ],
        };
      case "user":
        return {
          title: "User Dashboard",
          description: "Browse publishers and manage your account",
          features: [
            {
              icon: Building,
              label: "Browse Publishers",
              href: "/dashboard/publishers",
            },
            { icon: FileText, label: "My Account", href: "/account" },
          ],
        };
      default:
        return {
          title: "Dashboard",
          description: "Overview of provinces and publishers in the system",
          features: [],
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-8">
          {/* Welcome Header */}
          <div id="dashboard-overview">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-muted-foreground mt-1">
                  {roleContent.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {formatUserRole(user.role || "user")}
                </Badge>
                {tourCompleted && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Onboarding Complete
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Role-specific Quick Actions */}
          {roleContent.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks based on your role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  {roleContent.features.map((feature, index) => (
                    <Link key={index} href={feature.href}>
                      <Button
                        variant={index === 0 ? "default" : "outline"}
                        className="flex items-center gap-2"
                      >
                        <feature.icon className="h-4 w-4" />
                        {feature.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Provinces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {provinceCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered provinces
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Publishers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {publisherCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active publishers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Publishers */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Publishers</CardTitle>
              <CardDescription>
                Latest publisher registrations and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPublishers.map((pub) => (
                  <div
                    key={pub.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{pub.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{pub.provinceName}</span>
                        <span>•</span>
                        <span>
                          Added {new Date(pub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {pub.website && (
                      <a
                        href={pub.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Setup Reminder */}
          {!tourCompleted && (
            <Card id="account-setup" className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Complete Your Account
                </CardTitle>
                <CardDescription>
                  Set up your account to get the most out of Tender Hub
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/account">
                  <Button>Update Account</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          userRole={user.role || "user"}
          userName={user.name}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
}
