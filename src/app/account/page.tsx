"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatUserRole, getUserInitials } from "@/lib/auth-utils-client";
import { cn } from "@/lib/utils";
import {
  authDefaultValues,
  type UpdateProfileFormData,
  updateProfileFormSchema,
} from "@/lib/validations/auth";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
}

interface ProfileCompleteness {
  percentage: number;
  missingFields: string[];
  requiredFields: string[];
  optionalFields: string[];
}

interface PendingRequest {
  id: string;
  requestedChanges: Record<string, any>;
  status: string;
  requestedAt: string;
  rejectionReason?: string;
}

export default function AccountPage() {
  // Update page title and metadata
  const pageTitle = "Account";
  const pageDescription = "Manage your account settings and account information";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(
    null,
  );
  const [pendingRequests, _setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMethod, setSaveMethod] = useState<"direct" | "approval">("direct");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: authDefaultValues.updateProfile,
  });

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/account");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setCompleteness(data.completeness);

        // Update form with current values
        if (data.profile) {
          form.reset({
            name: data.profile.name || "",
            email: data.profile.email || "",
          });
        }
      } else {
        setMessage({ type: "error", text: "Failed to load account data" });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Error loading account" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      // This would be implemented when the pending requests API is available
      // const response = await fetch("/api/user/profile/pending-requests");
      // if (response.ok) {
      //   const data = await response.json();
      //   setPendingRequests(data.requests);
      // }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  // Fetch user account data
  useEffect(() => {
    fetchProfile();
  }, []);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      setIsSaving(true);
      setMessage(null);

      const endpoint =
        saveMethod === "approval" ? "/api/user/account" : "/api/user/account";
      const method = saveMethod === "approval" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          method === "POST"
            ? { changes: data, reason: "Profile update request" }
            : data,
        ),
      });

      if (response.ok) {
        const _result = await response.json();
        setMessage({
          type: "success",
          text:
            method === "POST"
              ? "Account update request submitted successfully"
              : "Account updated successfully",
        });

        if (method === "PUT") {
          await fetchProfile(); // Refresh account data
        } else {
          await fetchPendingRequests(); // Refresh pending requests
        }
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Failed to save profile",
        });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Error saving account" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/user/account/image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchProfile(); // Refresh account data
        setMessage({
          type: "success",
          text: "Account image updated successfully",
        });
      } else {
        setMessage({ type: "error", text: "Failed to upload image" });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Error uploading image" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen">
        <div className="w-full">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="w-full max-w-5xl mx-auto">
          <Alert>
            <AlertDescription>
              Failed to load account data. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getHomeUrl = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'manager':
        return '/manager';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => window.location.href = getHomeUrl(profile?.role || 'user')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
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
              {completeness.missingFields.length} field{completeness.missingFields.length !== 1 ? 's' : ''} to complete
            </div>
          </div>
        )}

        {message && (
          <Alert
            className={cn(
              "mb-6",
              message.type === "success"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50",
            )}
          >
            <AlertDescription
              className={cn(
                message.type === "success" ? "text-green-800" : "text-red-800",
              )}
            >
              {message.text}
              {message.type === "error" && message.text.includes("Email is already in use") && (
                <div className="mt-2 text-sm">
                  <strong>What to do:</strong> Try a different email address or contact your administrator if you believe this is an error.
                </div>
              )}
              {message.type === "error" && message.text.includes("Validation failed") && (
                <div className="mt-2 text-sm">
                  <strong>What to do:</strong> Check that your name contains only letters, spaces, hyphens, and apostrophes, and ensure your email is in a valid format.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your personal information and account picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.image} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {getUserInitials({
                      name: profile.name,
                      email: profile.email,
                    } as any)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      className="cursor-pointer"
                    >
                      {isUploading ? "Uploading..." : "Change Picture"}
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-label="Upload account picture"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                            aria-describedby="name-description"
                          />
                        </FormControl>
                        <FormDescription id="name-description">
                          Your display name visible to other users
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                            disabled
                            aria-describedby="email-description"
                          />
                        </FormControl>
                        <FormDescription id="email-description">
                          {profile.emailVerified ? (
                            <span className="text-green-600 flex items-center gap-1">
                              ✓ Email verified
                            </span>
                          ) : (
                            "Email verification required"
                          )}
                          <br />
                          <span className="text-muted-foreground text-xs">
                            Email changes must be requested through your administrator.
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Current User Information */}
          <Card>
            <CardHeader>
              <CardTitle>Current User Information</CardTitle>
              <CardDescription>Your current account details and session information</CardDescription>
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
                    <span className="text-muted-foreground">Session Started</span>
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
                        Fill in the missing information below to get the most out of Tender Hub:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {completeness.missingFields.map((field) => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                            {field === "name" && "Full Name"}
                            {field === "email" && "Email Address"}
                            {field === "role" && "User Role"}
                            {!["name", "email", "role"].includes(field) && field.charAt(0).toUpperCase() + field.slice(1)}
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

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pending Approval Requests</CardTitle>
              <CardDescription>
                Your account update requests awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Pending Approval</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(request.requestedAt), "PPP")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Requested Changes:</p>
                      <ul className="text-sm text-muted-foreground">
                        {Object.entries(request.requestedChanges).map(
                          ([key, value]) => (
                            <li key={key}>
                              {key}: {String(value)}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                    {request.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong>{" "}
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}