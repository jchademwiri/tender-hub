"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { invitationValidationHelpers } from "@/lib/validations/invitations";

interface CreateInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateInvitationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateInvitationDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: "user" as "admin" | "manager" | "user",
    sendEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle form input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Validate using the schema
      const validationResult = invitationValidationHelpers.safeValidateCreateInvitation(formData);

      if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.issues.forEach(issue => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      // Submit the invitation
      console.log("Sending invitation data:", JSON.stringify(validationResult.data, null, 2));

      // Include credentials to ensure cookies are sent
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // This ensures cookies are sent with the request
        body: JSON.stringify(validationResult.data),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log("Error response data:", JSON.stringify(errorData, null, 2));
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          // If we can't parse the error response, create a generic error
          errorData = { error: "Invalid response from server" };
        }

        if (response.status === 409) {
          setErrors({ email: errorData.error || "User with this email already exists" });
          return;
        }

        if (response.status === 429) {
          setErrors({ email: errorData.error || "Daily invitation limit reached" });
          return;
        }

        throw new Error(errorData.error || "Failed to create invitation");
      }

      const result = await response.json();

      toast.success("Invitation created successfully!");

      // Reset form
      setFormData({
        email: "",
        role: "user",
        sendEmail: true,
      });
      setErrors({});

      // Close dialog and notify parent
      onOpenChange(false);
      onSuccess();

    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create invitation");
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      setFormData({
        email: "",
        role: "user",
        sendEmail: true,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Create New Invitation
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a new user. They will receive an email with instructions to join the platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={loading}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.email}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange("role", value)}
              disabled={loading}
            >
              <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.role}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Send Email Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sendEmail" className="text-sm font-medium">
                Send Email Notification
              </Label>
              <div className="text-sm text-muted-foreground">
                Send an email invitation to the user
              </div>
            </div>
            <Switch
              id="sendEmail"
              checked={formData.sendEmail}
              onCheckedChange={(checked) => handleInputChange("sendEmail", checked)}
              disabled={loading}
            />
          </div>

          {/* Form Actions */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}