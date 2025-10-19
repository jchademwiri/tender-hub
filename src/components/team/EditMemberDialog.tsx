"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { TeamMember } from "./TeamMemberTable";

const editMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["owner", "admin", "manager", "user"]).optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
});

type EditMemberForm = z.infer<typeof editMemberSchema>;

interface EditMemberDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memberId: string, data: EditMemberForm) => Promise<void>;
  isSaving?: boolean;
  canEditRole?: boolean;
  canEditStatus?: boolean;
  availableRoles?: Array<{ value: string; label: string; description: string }>;
}

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
  canEditRole = false,
  canEditStatus = false,
  availableRoles = [
    { value: "user", label: "User", description: "Basic access to the platform" },
    { value: "manager", label: "Manager", description: "Can manage users and content" },
    { value: "admin", label: "Admin", description: "Full administrative access" },
  ],
}: EditMemberDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      name: "",
      role: undefined,
      status: undefined,
    },
  });

  // Update form when member changes
  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        role: canEditRole ? member.role : undefined,
        status: canEditStatus ? member.status : undefined,
      });
    }
  }, [member, canEditRole, canEditStatus]);

  const onSubmit = async (data: EditMemberForm) => {
    if (!member) return;

    try {
      setError(null);
      await onSave(member.id, data);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update {member.name}'s information and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canEditRole && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{role.label}</span>
                              {/* <span className="text-xs text-gray-500">{role.description}</span> */}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {canEditStatus && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex flex-col">
                            <span className="font-medium">Active</span>
                            {/* <span className="text-xs text-gray-500">Member can access the platform</span> */}
                          </div>
                        </SelectItem>
                        <SelectItem value="suspended">
                          <div className="flex flex-col">
                            <span className="font-medium">Suspended</span>
                            {/* <span className="text-xs text-gray-500">Member cannot access the platform</span> */}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}