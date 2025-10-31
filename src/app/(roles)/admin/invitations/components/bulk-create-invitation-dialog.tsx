"use client";

import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import Papa, { type ParseResult } from "papaparse";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invitationValidationHelpers } from "@/lib/validations/invitations";

interface BulkInvitationData {
  email: string;
  role: "admin" | "manager" | "user";
  name?: string;
  department?: string;
  customMessage?: string;
}

interface BulkCreateInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProcessingResult {
  success: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

export function BulkCreateInvitationDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkCreateInvitationDialogProps) {
  const [activeTab, setActiveTab] = useState("manual");
  const [invitations, setInvitations] = useState<BulkInvitationData[]>([
    { email: "", role: "user" },
  ]);
  const [globalRole, setGlobalRole] = useState<"admin" | "manager" | "user">(
    "user",
  );
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, _setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add new invitation row
  const addInvitation = () => {
    setInvitations((prev) => [...prev, { email: "", role: globalRole }]);
  };

  // Remove invitation row
  const removeInvitation = (index: number) => {
    if (invitations.length > 1) {
      setInvitations((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Update invitation data
  const updateInvitation = (
    index: number,
    field: keyof BulkInvitationData,
    value: string,
  ) => {
    setInvitations((prev) =>
      prev.map((inv, i) => (i === index ? { ...inv, [field]: value } : inv)),
    );
    // Clear errors when user starts typing
    if (errors[`invitation-${index}-${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`invitation-${index}-${field}`]: "",
      }));
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<any>) => {
        const parsedInvitations: BulkInvitationData[] = [];

        results.data.forEach((row: any, index: number) => {
          const email = row.email || row.Email || "";
          const role = (row.role || row.Role || globalRole).toLowerCase();
          const name = row.name || row.Name || "";
          const department = row.department || row.Department || "";
          const customMessage = row.customMessage || row.CustomMessage || "";

          if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            parsedInvitations.push({
              email: email.trim(),
              role: ["admin", "manager", "user"].includes(role)
                ? (role as "admin" | "manager" | "user")
                : globalRole,
              name: name.trim() || undefined,
              department: department.trim() || undefined,
              customMessage: customMessage.trim() || undefined,
            });
          } else {
            setErrors((prev) => ({
              ...prev,
              [`csv-${index}`]: `Invalid email format: ${email}`,
            }));
          }
        });

        if (parsedInvitations.length > 0) {
          setInvitations(parsedInvitations);
          toast.success(
            `Imported ${parsedInvitations.length} invitations from CSV`,
          );
        } else {
          toast.error("No valid invitations found in CSV file");
        }
      },
      error: (error: Papa.ParseError) => {
        toast.error("Failed to parse CSV file");
        console.error("CSV parse error:", error);
      },
    } as any);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent =
      "email,role,name,department,customMessage\nemployee@company.com,user,Employee Name,Department,Welcome to our platform!";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitation-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Validate all invitations
  const validateInvitations = () => {
    const newErrors: Record<string, string> = {};

    invitations.forEach((invitation, index) => {
      if (!invitation.email.trim()) {
        newErrors[`invitation-${index}-email`] = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitation.email)) {
        newErrors[`invitation-${index}-email`] =
          "Please enter a valid email address";
      }

      if (!invitation.role) {
        newErrors[`invitation-${index}-role`] = "Role is required";
      }
    });

    // Check for duplicate emails
    const emailCounts = invitations.reduce(
      (acc, inv) => {
        acc[inv.email] = (acc[inv.email] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    Object.entries(emailCounts).forEach(([email, count]) => {
      if (count > 1) {
        invitations.forEach((inv, index) => {
          if (inv.email === email) {
            newErrors[`invitation-${index}-email`] = "Duplicate email address";
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Process invitations in batches
  const processInvitations = async () => {
    if (!validateInvitations()) {
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults(null);

    const batchSize = 10;
    const totalBatches = Math.ceil(invitations.length / batchSize);
    let successCount = 0;
    let failedCount = 0;
    const processErrors: Array<{ email: string; error: string }> = [];

    try {
      for (let i = 0; i < invitations.length; i += batchSize) {
        const batch = invitations.slice(i, i + batchSize);

        const batchPromises = batch.map(async (invitation) => {
          try {
            const validationResult =
              invitationValidationHelpers.safeValidateCreateInvitation({
                email: invitation.email,
                role: invitation.role,
                sendEmail,
              });

            if (!validationResult.success) {
              throw new Error("Validation failed");
            }

            const response = await fetch("/api/admin/invitations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(validationResult.data),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to create invitation");
            }

            return { success: true, email: invitation.email };
          } catch (error) {
            return {
              success: false,
              email: invitation.email,
              error: error instanceof Error ? error.message : "Unknown error",
            } as const;
          }
        });

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach((result) => {
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
            processErrors.push({
              email: result.email,
              error: result.error || "Unknown error",
            });
          }
        });

        // Update progress
        const currentBatch = Math.floor(i / batchSize) + 1;
        setProgress((currentBatch / totalBatches) * 100);
      }

      setResults({
        success: successCount,
        failed: failedCount,
        errors: processErrors,
      });

      if (successCount > 0) {
        toast.success(
          `Successfully created ${successCount} invitation${successCount !== 1 ? "s" : ""}`,
        );
      }

      if (failedCount > 0) {
        toast.error(
          `Failed to create ${failedCount} invitation${failedCount !== 1 ? "s" : ""}`,
        );
      }
    } catch (error) {
      console.error("Bulk invitation processing error:", error);
      toast.error("Failed to process invitations");
    } finally {
      setProcessing(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading && !processing) {
      setInvitations([{ email: "", role: "user" }]);
      setGlobalRole("user");
      setSendEmail(true);
      setErrors({});
      setResults(null);
      setProgress(0);
      setActiveTab("manual");
      onOpenChange(false);
    }
  };

  // Handle successful completion
  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Create Invitations
          </DialogTitle>
          <DialogDescription>
            Create multiple invitations at once using manual entry or CSV upload
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Manual Entry</CardTitle>
                    <CardDescription>
                      Add invitations manually, one by one
                    </CardDescription>
                  </div>
                  <Button onClick={addInvitation} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Global Settings */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="globalRole">Default Role</Label>
                    <Select
                      value={globalRole}
                      onValueChange={(value: "admin" | "manager" | "user") =>
                        setGlobalRole(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="sendEmail"
                        className="text-sm font-medium"
                      >
                        Send Email Notifications
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Send invitations immediately
                      </div>
                    </div>
                    <Switch
                      id="sendEmail"
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                    />
                  </div>
                </div>

                {/* Invitation Rows */}
                <div className="space-y-3">
                  {invitations.map((invitation, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Input
                          placeholder="Enter email address"
                          value={invitation.email}
                          onChange={(e) =>
                            updateInvitation(index, "email", e.target.value)
                          }
                          className={
                            errors[`invitation-${index}-email`]
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {errors[`invitation-${index}-email`] && (
                          <p className="text-sm text-destructive mt-1">
                            {errors[`invitation-${index}-email`]}
                          </p>
                        )}
                      </div>

                      <div className="w-32">
                        <Select
                          value={invitation.role}
                          onValueChange={(
                            value: "admin" | "manager" | "user",
                          ) => updateInvitation(index, "role", value)}
                        >
                          <SelectTrigger
                            className={
                              errors[`invitation-${index}-role`]
                                ? "border-destructive"
                                : ""
                            }
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors[`invitation-${index}-role`] && (
                          <p className="text-sm text-destructive mt-1">
                            {errors[`invitation-${index}-role`]}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvitation(index)}
                        disabled={invitations.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground">
                  {invitations.length} invitation
                  {invitations.length !== 1 ? "s" : ""} ready to send
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CSV Upload</CardTitle>
                <CardDescription>
                  Upload a CSV file with invitation data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upload a CSV file with columns: email, role, name,
                      department, customMessage
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      Choose CSV File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {invitations.length} invitations loaded from CSV
                  </span>
                </div>

                {/* Show CSV errors */}
                {Object.keys(errors).some((key) => key.startsWith("csv-")) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {Object.entries(errors)
                          .filter(([key]) => key.startsWith("csv-"))
                          .map(([key, error]) => (
                            <div key={key} className="text-sm">
                              {error}
                            </div>
                          ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Progress and Results */}
        {processing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Processing invitations...
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {results && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Processing Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{results.success} successful</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">{results.failed} failed</span>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Errors:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {results.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm text-destructive bg-destructive/10 p-2 rounded"
                      >
                        <strong>{error.email}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading || processing}
          >
            {results ? "Close" : "Cancel"}
          </Button>

          {!results && (
            <Button
              onClick={processInvitations}
              disabled={loading || processing || invitations.length === 0}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {processing
                ? "Processing..."
                : `Create ${invitations.length} Invitation${invitations.length !== 1 ? "s" : ""}`}
            </Button>
          )}

          {results && <Button onClick={handleSuccess}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
