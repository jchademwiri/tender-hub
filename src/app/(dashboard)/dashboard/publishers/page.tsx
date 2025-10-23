import Link from "next/link";
import { getAllPublishers } from "@/server/publisher";
import { PublishersTableClient } from "./publishers-table-client";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function PublishersPage() {
  const user = await getCurrentUser();
  const userId = user?.id;
  const publishers = await getAllPublishers(userId);

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

        <div className="bg-card rounded-lg border shadow-sm">
          <PublishersTableClient publishers={publishers} />
        </div>

        <div className="flex justify-start">
          <Link
            href="/"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
