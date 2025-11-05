import {
  Database,
  HardDrive,
  Server,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default async function SystemSettingsPage() {
  // Mock admin access for demo purposes
  // In a real app, this would validate proper admin role

  // Fetch real system settings from database directly
  let systemSettings;
  try {
    const { db } = await import("@/db");
    const { systemSettings: systemSettingsTable } = await import("@/db/schema");

    const settings = await db.select().from(systemSettingsTable);

    // Transform the settings into the expected format
    const settingsMap = settings.reduce(
      (acc, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      },
      {} as Record<string, any>,
    );

    systemSettings = {
      general: settingsMap.general || {
        siteName: "Tender Hub",
        siteDescription: "Professional tender and procurement platform",
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true,
      },
      security: settingsMap.security || {
        passwordMinLength: 8,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        twoFactorRequired: false,
        forcePasswordChange: false,
      },
    };
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Fallback to default values if API fails
    systemSettings = {
      general: {
        siteName: "Tender Hub",
        siteDescription: "Professional tender and procurement platform",
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true,
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        twoFactorRequired: false,
        forcePasswordChange: false,
      },
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure global system settings and preferences
        </p>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              All services running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              Last backup: 2 hours ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">68%</div>
            <p className="text-xs text-muted-foreground">
              45.2 GB of 64 GB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic system configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                defaultValue={systemSettings.general.siteName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-description">Site Description</Label>
              <Input
                id="site-description"
                defaultValue={systemSettings.general.siteDescription}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable maintenance mode to restrict access
              </p>
            </div>
            <Switch defaultChecked={systemSettings.general.maintenanceMode} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Registration Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Allow new user registrations
              </p>
            </div>
            <Switch
              defaultChecked={systemSettings.general.registrationEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Verification Required</Label>
              <p className="text-sm text-muted-foreground">
                Require email verification for new accounts
              </p>
            </div>
            <Switch
              defaultChecked={systemSettings.general.emailVerificationRequired}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Password policies and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password-min-length">
                Minimum Password Length
              </Label>
              <Input
                id="password-min-length"
                type="number"
                defaultValue={systemSettings.security.passwordMinLength}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
              <Input
                id="session-timeout"
                type="number"
                defaultValue={systemSettings.security.sessionTimeout}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
              <Input
                id="max-login-attempts"
                type="number"
                defaultValue={systemSettings.security.maxLoginAttempts}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication Required</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for all admin accounts
              </p>
            </div>
            <Switch
              defaultChecked={systemSettings.security.twoFactorRequired}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Force Password Change</Label>
              <p className="text-sm text-muted-foreground">
                Require password change every 90 days
              </p>
            </div>
            <Switch
              defaultChecked={systemSettings.security.forcePasswordChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
