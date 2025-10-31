import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * TODO: User Dashboard Implementation Checklist
 *
 * PERSONAL OVERVIEW:
 * [ ] Welcome message with user's name and role
 * [ ] Account status and verification indicators
 * [ ] Recent activity summary
 * [ ] Quick stats (logins, actions, etc.)
 * [ ] Account health and security status
 *
 * USER PROFILE MANAGEMENT:
 * [ ] Current profile information display
 * [ ] Profile completion status
 * [ ] Request profile update functionality
 * [ ] Account security settings access
 * [ ] Privacy and data export options
 *
 * USER ACTIVITY DASHBOARD:
 * [ ] Recent login history and devices
 * [ ] Actions performed and pages visited
 * [ ] Time spent and engagement metrics
 * [ ] Personal analytics and insights
 * [ ] Activity trends and patterns
 *
 * USER WORKFLOWS:
 * [ ] Profile update request submission
 * [ ] Password change and security updates
 * [ ] Notification preferences management
 * [ ] Data export and privacy requests
 * [ ] Help and support ticket creation
 *
 * USER QUICK ACTIONS:
 * [ ] Update profile information
 * [ ] Change password or security settings
 * [ ] Download personal data
 * [ ] Access help and support
 * [ ] Manage notification preferences
 */

export default function UserDashboard() {
  return (
    <div className="">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, John!
        </h2>
        <p className="text-muted-foreground">
          Here's your personal workspace overview
        </p>
      </div>

      {/* Personal Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Actions this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">A+</div>
            <p className="text-xs text-muted-foreground">
              Strong security practices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile & Activity Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your current account details and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">John Doe</p>
              </div>
              <div>
                <p className="text-sm font-medium">Role</p>
                <Badge variant="secondary">User</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  user@company.com
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">Jan 2024</p>
              </div>
            </div>
            <div className="pt-4">
              <Button variant="outline" className="w-full">
                Request Profile Update
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your account and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              Update Profile
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Security Settings
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Notification Preferences
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Download My Data
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Help & Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent actions and system interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Login</Badge>
              <span className="text-sm text-muted-foreground">
                Logged in from Chrome on Windows
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                2h ago
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Profile View</Badge>
              <span className="text-sm text-muted-foreground">
                Viewed publisher information
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                1d ago
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Data Export</Badge>
              <span className="text-sm text-muted-foreground">
                Downloaded personal activity data
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                3d ago
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
