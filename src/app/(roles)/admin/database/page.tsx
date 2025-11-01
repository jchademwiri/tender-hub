import { requireAuth } from "@/lib/auth-utils";
import { DatabaseManagementClient } from "./database-management-client";

export default async function DatabaseManagementPage() {
  // Get authenticated user
  const session = await requireAuth();

  // Only admins and owners can access database management
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You don't have permission to access database management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DatabaseManagementClient />
    </div>
  );
}
