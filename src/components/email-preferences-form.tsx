"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Shield, Bell, TrendingUp, Loader2 } from "lucide-react";

interface EmailPreferences {
  invitations: boolean;
  passwordReset: boolean;
  emailVerification: boolean;
  accountDeletion: boolean;
  passwordChanged: boolean;
  approvalDecisions: boolean;
  systemMaintenance: boolean;
  userStatusChanges: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
  immediateNotifications: boolean;
  dailyDigest: boolean;
  weeklyDigestNotifications: boolean;
  lastUpdated: string;
}

export function EmailPreferencesForm() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/email-preferences");
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data.preferences);
      } else {
        toast.error("Failed to load email preferences");
      }
    } catch (error) {
      toast.error("Failed to load email preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<EmailPreferences>) => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch("/api/email-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: updates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.data.preferences);
        toast.success("Email preferences updated successfully");
      } else {
        toast.error(data.error?.message || "Failed to update preferences");
      }
    } catch (error) {
      toast.error("Failed to update email preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferences, value: boolean) => {
    if (!preferences) return;
    
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferences({ [key]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading email preferences...</span>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Failed to load email preferences. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Emails */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle>Security & Account Emails</CardTitle>
          </div>
          <CardDescription>
            Important emails for account security and verification. These cannot be disabled for your protection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="password-reset" className="flex-1">
              Password Reset
              <p className="text-sm text-muted-foreground">When you request a password reset</p>
            </Label>
            <Switch
              id="password-reset"
              checked={true}
              disabled={true}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email-verification" className="flex-1">
              Email Verification
              <p className="text-sm text-muted-foreground">When you need to verify your email address</p>
            </Label>
            <Switch
              id="email-verification"
              checked={true}
              disabled={true}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="password-changed" className="flex-1">
              Password Changed
              <p className="text-sm text-muted-foreground">When your password is successfully changed</p>
            </Label>
            <Switch
              id="password-changed"
              checked={true}
              disabled={true}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="account-deletion" className="flex-1">
              Account Deletion
              <p className="text-sm text-muted-foreground">When you request to delete your account</p>
            </Label>
            <Switch
              id="account-deletion"
              checked={true}
              disabled={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <CardTitle>System Notifications</CardTitle>
          </div>
          <CardDescription>
            Updates about your account, approvals, and system changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="invitations" className="flex-1">
              Invitations
              <p className="text-sm text-muted-foreground">When you're invited to join Tender Hub</p>
            </Label>
            <Switch
              id="invitations"
              checked={preferences.invitations}
              onCheckedChange={(checked) => handleToggle("invitations", checked)}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="approval-decisions" className="flex-1">
              Approval Decisions
              <p className="text-sm text-muted-foreground">When your requests are approved or rejected</p>
            </Label>
            <Switch
              id="approval-decisions"
              checked={preferences.approvalDecisions}
              onCheckedChange={(checked) => handleToggle("approvalDecisions", checked)}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="user-status-changes" className="flex-1">
              Account Status Changes
              <p className="text-sm text-muted-foreground">When your account status or role changes</p>
            </Label>
            <Switch
              id="user-status-changes"
              checked={preferences.userStatusChanges}
              onCheckedChange={(checked) => handleToggle("userStatusChanges", checked)}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="system-maintenance" className="flex-1">
              System Maintenance
              <p className="text-sm text-muted-foreground">Scheduled maintenance and system updates</p>
            </Label>
            <Switch
              id="system-maintenance"
              checked={preferences.systemMaintenance}
              onCheckedChange={(checked) => handleToggle("systemMaintenance", checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports & Digests */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <CardTitle>Reports & Digests</CardTitle>
          </div>
          <CardDescription>
            Regular updates and summaries of your activity and system insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-digest" className="flex-1">
              Weekly Digest
              <p className="text-sm text-muted-foreground">Weekly summary of new tenders and activity</p>
            </Label>
            <Switch
              id="weekly-digest"
              checked={preferences.weeklyDigest}
              onCheckedChange={(checked) => handleToggle("weeklyDigest", checked)}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="monthly-report" className="flex-1">
              Monthly Report
              <p className="text-sm text-muted-foreground">Monthly analytics and performance report</p>
            </Label>
            <Switch
              id="monthly-report"
              checked={preferences.monthlyReport}
              onCheckedChange={(checked) => handleToggle("monthlyReport", checked)}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-digest" className="flex-1">
              Daily Digest
              <p className="text-sm text-muted-foreground">Daily summary of new opportunities</p>
            </Label>
            <Switch
              id="daily-digest"
              checked={preferences.dailyDigest}
              onCheckedChange={(checked) => handleToggle("dailyDigest", checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-orange-600" />
            <CardTitle>Marketing & Promotions</CardTitle>
          </div>
          <CardDescription>
            Optional promotional content and marketing communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing-emails" className="flex-1">
              Marketing Emails
              <p className="text-sm text-muted-foreground">Product updates, tips, and promotional content</p>
            </Label>
            <Switch
              id="marketing-emails"
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) => handleToggle("marketingEmails", checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Last updated: {new Date(preferences.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}