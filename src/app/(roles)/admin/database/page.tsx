import { DatabaseManagementClient } from "./database-management-client";

export default async function DatabaseManagementPage() {
  // Mock admin access for demo purposes
  // In a real app, this would validate proper admin role

  return (
    <div className="space-y-6">
      <DatabaseManagementClient />
    </div>
  );
}
