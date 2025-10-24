import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";
import { getAllPublishers } from "@/server/publisher";
import { PublishersTableClient } from "./publishers-table-client";
import { getCurrentUser } from "@/lib/auth-utils";
import { ErrorState } from "@/components/ui/error-state";
import { NoDataEmptyState } from "@/components/ui/empty-state";

export default async function PublishersPage() {
  const user = await getCurrentUser();
  const userId = user?.id;

  try {
    const publishers = await getAllPublishers(userId);
    // Handle empty publishers data
    if (!publishers || publishers.length === 0) {
      return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Tender Publishers
              </h1>
              <p className="text-muted-foreground">
                Manage and view all tender publishers in the system
              </p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-6">
              <NoDataEmptyState
                title="No Publishers Found"
                message="There are no tender publishers in the system yet. Publishers will appear here once they are added to the database."
              />
            </div>

            <div className="flex justify-start">
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tender Publishers
            </h1>
            <p className="text-muted-foreground">
              Manage and view all tender publishers in the system
            </p>
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <PublishersTableClient publishers={publishers} />
          </div>

          <div className="flex justify-start">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading publishers page:", error);

    // Handle specific error types
    if (error && typeof error === "object" && "code" in error) {
      const appError = error as {
        code: string;
        message: string;
        details?: any;
      };

      if (appError.code === "TABLE_MISSING") {
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Tender Publishers
                    </h1>
                    <p className="text-muted-foreground">
                      Manage and view all tender publishers in the system
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border shadow-sm p-6">
                <ErrorState
                  title="Database Setup Required"
                  message="The publishers table does not exist. Please run database migrations to set up the required tables."
                  showHomeButton={true}
                />
              </div>

              <div className="flex justify-start">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        );
      }

      if (appError.code === "DB_CONNECTION_FAILED") {
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Tender Publishers
                </h1>
                <p className="text-muted-foreground">
                  Manage and view all tender publishers in the system
                </p>
              </div>

              <div className="bg-card rounded-lg border shadow-sm p-6">
                <ErrorState
                  title="Database Connection Failed"
                  message="Unable to connect to the database. Please check your database configuration and ensure the database server is running."
                  showHomeButton={true}
                />
              </div>

              <div className="flex justify-start">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        );
      }
    }

    // Generic error handling
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tender Publishers
            </h1>
            <p className="text-muted-foreground">
              Manage and view all tender publishers in the system
            </p>
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <ErrorState
              title="Failed to Load Publishers"
              message="An unexpected error occurred while loading the publishers. Please try again later."
              showHomeButton={true}
            />
          </div>

          <div className="flex justify-start">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
