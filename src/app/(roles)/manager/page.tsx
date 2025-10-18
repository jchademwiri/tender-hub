import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * TODO: Manager Dashboard Implementation Checklist
 *
 * TEAM MANAGEMENT OVERVIEW:
 * [ ] Team member count and status overview
 * [ ] Recent team member activities and logins
 * [ ] Team performance metrics and KPIs
 * [ ] Pending profile update approvals
 * [ ] Team invitation status and response rates
 *
 * MANAGER WORKFLOW DASHBOARD:
 * [ ] Profile update requests awaiting approval
 * [ ] Team member onboarding progress
 * [ ] Performance review schedules and deadlines
 * [ ] Resource allocation and utilization
 * [ ] Team communication and collaboration status
 *
 * MANAGER ANALYTICS:
 * [ ] Team productivity trends and insights
 * [ ] Individual team member performance
 * [ ] Department/project specific metrics
 * [ ] Time tracking and resource utilization
 * [ ] Goal completion and milestone tracking
 *
 * MANAGER QUICK ACTIONS:
 * [ ] Invite new team members
 * [ ] Review pending profile updates
 * [ ] Schedule performance reviews
 * [ ] Access team management tools
 * [ ] Generate team reports
 *
 * MANAGER NOTIFICATIONS:
 * [ ] Pending approvals and reviews
 * [ ] Team member status changes
 * [ ] Upcoming deadlines and milestones
 * [ ] System alerts and updates
 * [ ] Team member achievements
 */

export default function ManagerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
        <p className="text-muted-foreground">
          Team management and operational oversight
        </p>
      </div>

      {/* Team Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">5</div>
            <p className="text-xs text-muted-foreground">
              Profile updates awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">
              Above target this quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Team Activity</CardTitle>
            <CardDescription>
              Latest activities from your team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Profile Update</Badge>
              <span className="text-sm text-muted-foreground">
                Sarah Johnson requested profile update
              </span>
              <span className="text-xs text-muted-foreground ml-auto">1h ago</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">New Login</Badge>
              <span className="text-sm text-muted-foreground">
                Mike Chen logged in from new device
              </span>
              <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Project Complete</Badge>
              <span className="text-sm text-muted-foreground">
                Q4 Budget Analysis completed by team
              </span>
              <span className="text-xs text-muted-foreground ml-auto">4h ago</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Manager Actions</CardTitle>
            <CardDescription>
              Quick access to management tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              Review Pending Approvals
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Invite Team Member
            </Button>
            <Button className="w-full justify-start" variant="outline">
              View Team Reports
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Schedule Review
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Team Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Updates Awaiting Approval</CardTitle>
          <CardDescription>
            Review and approve team member profile changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">
                  Requested role change from User to Manager
                </p>
              </div>
              <div className="space-x-2">
                <Button size="sm" variant="outline">Review</Button>
                <Button size="sm">Approve</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Mike Chen</p>
                <p className="text-xs text-muted-foreground">
                  Updated contact information and department
                </p>
              </div>
              <div className="space-x-2">
                <Button size="sm" variant="outline">Review</Button>
                <Button size="sm">Approve</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}