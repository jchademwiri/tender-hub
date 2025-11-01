import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getSessionWithRole } from "@/lib/auth-utils";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

function getUserInitials(user: { name: string; email: string }) {
  if (user.name) {
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email.slice(0, 2).toUpperCase();
}

function formatUserRole(role: string) {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'owner':
      return 'Owner';
    default:
      return 'User';
  }
}

function calculateAccountCompleteness(account: any): number {
  const fields = ["name", "email", "role"];
  const completedFields = fields.filter(field => account[field]);
  return Math.round((completedFields.length / fields.length) * 100);
}

function getMissingFields(account: any): string[] {
  const fields = ["name", "email", "role"];
  return fields.filter(field => !account[field]);
}

export default async function AccountPage() {
  // Get user session with role information
  const session = await getSessionWithRole();
  
  if (!session) {
    redirect('/sign-in');
  }

  // Get full user account data from database
  const userAccount = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      invitedBy: user.invitedBy,
      invitedAt: user.invitedAt,
      emailVerified: user.emailVerified,
      image: user.image,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userAccount.length === 0) {
    redirect('/sign-in');
  }

  const profile = userAccount[0];
  
  // Calculate account completeness
  const completeness = {
    percentage: calculateAccountCompleteness(profile),
    missingFields: getMissingFields(profile),
    requiredFields: ["name", "email", "role"],
    optionalFields: [],
  };

  const getHomeUrl = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "manager":
        return "/manager";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" asChild>
            <a href={getHomeUrl(profile.role)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </a>
          </Button>
          <h1 className="text-3xl font-bold">Account</h1>
        </div>

        {completeness && completeness.percentage < 100 && (
          <div className="flex items-center gap-4 mb-6">
            <div className="text-sm text-muted-foreground">
              Account Completeness
            </div>
            <div className="flex items-center gap-2">
              <Progress value={completeness.percentage} className="w-24" />
              <span className="text-sm font-medium">
                {completeness.percentage}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {completeness.missingFields.length} field
              {completeness.missingFields.length !== 1 ? "s" : ""} to complete
            </div>
          </div>
        )}



        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.image || undefined} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {getUserInitials({
                      name: profile.name,
                      email: profile.email,
                    })}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <Badge variant="secondary">
                    {formatUserRole(profile.role)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Full Name</span>
                    <span className="text-sm">{profile.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email Address</span>
                    <span className="text-sm">{profile.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User ID</span>
                    <span className="text-xs font-mono">{profile.id}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current User Information */}
          <Card>
            <CardHeader>
              <CardTitle>Current User Information</CardTitle>
              <CardDescription>
                Your current account details and session information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role</span>
                  <Badge variant="secondary">
                    {formatUserRole(profile.role)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={
                      profile.status === "active" ? "default" : "destructive"
                    }
                  >
                    {profile.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Verified</span>
                  <Badge
                    variant={profile.emailVerified ? "default" : "outline"}
                  >
                    {profile.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Account Created
                    </span>
                    <span>{format(new Date(profile.createdAt), "PPP")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{format(new Date(profile.updatedAt), "PPP")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Session Started
                    </span>
                    <span>{format(new Date(), "PPP")}</span>
                  </div>
                </div>

                {completeness && completeness.missingFields.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-orange-700">
                        Complete Your Account
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Fill in the missing information below to get the most
                        out of Tender Hub:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {completeness.missingFields.map((field) => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                            {field === "name" && "Full Name"}
                            {field === "email" && "Email Address"}
                            {field === "role" && "User Role"}
                            {!["name", "email", "role"].includes(field) &&
                              field.charAt(0).toUpperCase() + field.slice(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}
