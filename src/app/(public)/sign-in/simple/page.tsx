"use client";

import { useState } from "react";
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

export default function SimpleSignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);

    try {
      // Simple role detection based on email
      const lowerEmail = email.toLowerCase();
      let role = 'user';
      if (lowerEmail.includes('admin')) {
        role = 'admin';
      } else if (lowerEmail.includes('manager')) {
        role = 'manager';
      }

      // Create user data
      const userData = {
        id: `user-${Date.now()}`,
        email: email,
        name: email.split('@')[0].replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: role,
        status: "active"
      };

      // Store in localStorage
      localStorage.setItem('tender-hub-user', JSON.stringify(userData));
      
      // Success message
      toast.success(`Welcome, ${userData.name}!`);

      // Redirect based on role
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'manager') {
        router.push('/manager');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('tender-hub-user');
    toast.success("Signed out successfully");
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Sign in to Tender Hub
          </CardTitle>
          <CardDescription className="text-center">
            Simple sign-in for testing
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
                placeholder="Enter any password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center text-sm">
              <p className="text-muted-foreground font-medium">Test Credentials:</p>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>admin@test.com → Admin dashboard</p>
              <p>manager@test.com → Manager dashboard</p>
              <p>user@test.com → User dashboard</p>
              <p>Or any email with "admin" or "manager" in it</p>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}