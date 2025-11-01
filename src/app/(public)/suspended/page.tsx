"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function SuspendedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, redirect to sign-in
      router.push("/sign-in");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Suspended</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Your account has been suspended. Please contact a manager or
            administrator for further assistance.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="cursor-pointer"
            >
              Logout
            </Button>
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
