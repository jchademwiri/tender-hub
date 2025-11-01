"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check for invitation acceptance message in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    const emailParam = urlParams.get("email");
    const info = urlParams.get("info");

    if (message === "invitation-accepted" && emailParam) {
      setEmail(emailParam);

      if (info === "account-created") {
        toast.success("Account created successfully!", {
          description:
            "Your invitation has been accepted and your account is ready. Please sign in with your email and password.",
        });
      } else if (info === "contact-admin") {
        toast.success("Invitation accepted!", {
          description:
            "Please contact your administrator to get your user account created so you can sign in.",
        });
      } else {
        toast.success(
          "Invitation accepted! Please sign in with your email and password.",
        );
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔍 DEBUG: Attempting to sign in with:", email);

      const result = await authClient.signIn.email({
        email,
        password,
      });

      console.log("🔍 DEBUG: Sign in result:", result);

      if (result.error) {
        console.error(
          "❌ DEBUG: Sign in error details:",
          JSON.stringify(result.error, null, 2),
        );
        console.error(
          "🔍 DEBUG: Full result object:",
          JSON.stringify(result, null, 2),
        );

        // Handle different types of error responses from better-auth
        let errorMessage = "Invalid credentials";
        let actionGuidance = "";
        console.log("🔍 DEBUG: Processing error response");

        // Check if error has a message property
        if (
          result.error &&
          typeof result.error === "object" &&
          result.error.message
        ) {
          errorMessage = result.error.message;
          console.log(
            "🔍 DEBUG: Error message from result.error.message:",
            errorMessage,
          );
        }
        // Handle specific error codes if available
        else if (
          result.error &&
          typeof result.error === "object" &&
          result.error.code
        ) {
          console.log("🔍 DEBUG: Error code:", result.error.code);
          switch (result.error.code) {
            case "INVALID_EMAIL_OR_PASSWORD":
              errorMessage = "Invalid email or password";
              actionGuidance =
                "Double-check your email and password. If you forgot your password, contact your administrator.";
              break;
            case "EMAIL_NOT_VERIFIED":
              errorMessage = "Please verify your email before signing in";
              actionGuidance =
                "Check your email for a verification link. If you didn't receive it, contact your administrator.";
              console.log(
                "⚠️ DEBUG: User email not verified - this could be the issue!",
              );
              break;
            case "USER_NOT_FOUND":
              errorMessage = "No account found with this email";
              actionGuidance =
                "Make sure you're using the email address from your invitation. If you haven't accepted an invitation yet, please do so first.";
              console.log(
                "⚠️ DEBUG: User not found - account may not have been created properly",
              );
              break;
            case "TOO_MANY_REQUESTS":
              errorMessage =
                "Too many sign-in attempts. Please try again later";
              actionGuidance =
                "Wait a few minutes before trying again, or contact your administrator if this persists.";
              break;
            default:
              errorMessage = `Authentication error: ${result.error.code}`;
              actionGuidance =
                "If this error persists, please contact your administrator.";
          }
        } else {
          console.log(
            "🔍 DEBUG: Error structure:",
            typeof result.error,
            result.error,
          );
        }

        toast.error("Sign in failed", {
          description: `${errorMessage}${actionGuidance ? `\n\n${actionGuidance}` : ""}`,
        });
      } else {
        console.log("✅ DEBUG: Sign in successful");
        // The proxy middleware will handle suspended user checking and redirection
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("❌ DEBUG: Sign in exception:", error);
      toast.error("Sign in failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Sign in to Tender Hub
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          {/* <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Demo credentials: admin@test.com / testpassword123
            </p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
