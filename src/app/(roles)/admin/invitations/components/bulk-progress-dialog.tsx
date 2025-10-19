"use client";

import {
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface BulkOperationProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

interface BulkProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: string;
  progress: BulkOperationProgress;
  onRetry?: () => void;
  onComplete?: () => void;
}

export function BulkProgressDialog({
  open,
  onOpenChange,
  operation,
  progress,
  onRetry,
  onComplete,
}: BulkProgressDialogProps) {
  const [showErrors, setShowErrors] = useState(false);

  const percentage =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const isComplete = progress.completed === progress.total;
  const hasErrors = progress.errors.length > 0;

  // Auto-show errors when operation completes with failures
  useEffect(() => {
    if (isComplete && hasErrors) {
      setShowErrors(true);
    }
  }, [isComplete, hasErrors]);

  const handleClose = () => {
    if (!isComplete) return;
    onOpenChange(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleDownloadErrors = () => {
    if (progress.errors.length === 0) return;

    const csvContent = [
      "Email,Error",
      ...progress.errors.map((error) => `"${error.email}","${error.error}"`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-${operation}-errors.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2
              className={`h-5 w-5 ${isComplete ? "hidden" : "animate-spin"}`}
            />
            {isComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
            Bulk {operation.charAt(0).toUpperCase() + operation.slice(1)}{" "}
            Progress
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? `Completed processing ${progress.total} invitations`
              : `Processing ${progress.total} invitations...`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="w-full" />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">
                  {progress.completed}
                </div>
                <p className="text-xs text-muted-foreground">Processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">
                  {progress.successful}
                </div>
                <p className="text-xs text-muted-foreground">Successful</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">
                  {progress.failed}
                </div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
          </div>

          {/* Errors Section */}
          {hasErrors && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Errors ({progress.errors.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowErrors(!showErrors)}
                    >
                      {showErrors ? "Hide" : "Show"} Errors
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadErrors}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {showErrors && (
                <CardContent className="space-y-2">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {progress.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <div className="font-medium">{error.email}</div>
                          <div className="text-xs mt-1 opacity-90">
                            {error.error}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Success Message */}
          {isComplete && !hasErrors && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All {progress.total} invitations were {operation}ed
                successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isComplete && onRetry && hasErrors && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Failed
            </Button>
          )}

          <Button onClick={handleClose} disabled={!isComplete}>
            {isComplete ? "Close" : "Processing..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
