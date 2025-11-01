"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, Settings } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [emailType, setEmailType] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    const all = searchParams.get("all");

    setEmailType(type);

    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link. Please check the link from your email.");
      return;
    }

    // Process unsubscribe request
    const processUnsubscribe = async () => {
      try {
        const params = new URLSearchParams();
        params.set("token", token);
        if (type) params.set("type", type);
        if (all === "true") params.set("all", "true");

        const response = await fetch(`/api/unsubscribe?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error?.message || "Failed to unsubscribe");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while processing your request");
      }
    };

    processUnsubscribe();
  }, [searchParams]);

  const getEmailTypeDisplay = (type: string | null) => {
    if (!type) return "all non-security emails";
    
    const typeMap: Record<string, string> = {
      invitations: "invitation emails",
      approvalDecisions: "approval decision emails",
      systemMaintenance: "system maintenance emails",
      userStatusChanges: "user status change emails",
      marketingEmails: "marketing emails",
      weeklyDigest: "weekly digest emails",
      monthlyReport: "monthly report emails",
    };

    return typeMap[type] || `${type} emails`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          
          <CardTitle className="text-xl">
            {status === "loading" && "Processing Request..."}
            {status === "success" && "Unsubscribed Successfully"}
            {status === "error" && "Unsubscribe Failed"}
          </CardTitle>
          
          <CardDescription>
            {status === "loading" && "Please wait while we process your unsubscribe request."}
            {status === "success" && `You have been unsubscribed from ${getEmailTypeDisplay(emailType)}.`}
            {status === "error" && "We encountered an issue processing your request."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              status === "success" 
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Important Security Emails</p>
                    <p>You will still receive important security-related emails such as password resets and account verification.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Email Preferences
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    Return to Tender Hub
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Need Help?</p>
                  <p>If you continue to have issues, please contact our support team at{" "}
                    <a href="mailto:support@tenderhub.com" className="underline">
                      support@tenderhub.com
                    </a>
                  </p>
                </div>
              </div>

              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Return to Tender Hub
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <CardTitle className="text-xl">Loading...</CardTitle>
            <CardDescription>Processing your unsubscribe request.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}