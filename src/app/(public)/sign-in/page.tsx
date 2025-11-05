"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    // Read callbackUrl from the browser location on the client
    try {
      const sp = new URLSearchParams(window.location.search);
      setCallbackUrl(sp.get('callbackUrl'));
    } catch (e) {
      setCallbackUrl(null);
    }
  }, []);

  // Get redirect URL from provided callbackUrl state or default based on role
  const getRedirectUrl = (userRole: string) => {
    if (callbackUrl) {
      return callbackUrl;
    }
    
    // Default redirects based on role
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'manager':
        return '/manager';
      default:
        return '/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: getRedirectUrl('user'), // Default callback
      }, {
        onRequest: () => {
          // Show loading state
        },
        onSuccess: (ctx) => {
          const user = ctx.data?.user;
          if (user) {
            toast.success(`Welcome back, ${user.name || user.email}!`);
            
            // Redirect based on user role
            const redirectUrl = getRedirectUrl(user.role || 'user');
            router.push(redirectUrl);
            router.refresh(); // Refresh to update session state
          }
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Sign in failed");
        },
      });

      if (error) {
        toast.error(error.message || "Sign in failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred");
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
            Enter your credentials to access your account
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Enter your email and password to sign in</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
