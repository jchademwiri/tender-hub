"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

export function DatabaseSettingsClient() {
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'backup' }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Backup started successfully! ID: ${data.backupId}`);
      } else {
        toast.error('Failed to start backup');
      }
    } catch (error) {
      toast.error('Error starting backup');
      console.error('Backup error:', error);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <div className="space-y-0.5">
        <div className="text-sm font-medium leading-none">
          Manual Backup
        </div>
        <p className="text-sm text-muted-foreground">
          Create an immediate database backup
        </p>
      </div>
      <Button
        onClick={handleBackup}
        disabled={isBackingUp}
        variant="outline"
        type="button"
      >
        <Download className="h-4 w-4 mr-2" />
        {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
      </Button>
    </div>
  );
}