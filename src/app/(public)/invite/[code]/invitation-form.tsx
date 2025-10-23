"use client";

import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InvitationFormProps {
  invitationId: string;
  email: string;
  action: (
    prevState: any,
    formData: FormData,
  ) => Promise<
    | { error: string }
    | { success: boolean; message: string; redirectTo: string }
  >;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Account...
        </>
      ) : (
        "Create Account & Accept Invitation"
      )}
    </Button>
  );
}

export function InvitationForm({
  invitationId,
  email,
  action,
}: InvitationFormProps) {
  const [state, formAction] = useActionState(action, { error: "" });
  const router = useRouter();

  // Handle successful form submission and redirect
  useEffect(() => {
    if ("success" in state && state.success && "redirectTo" in state) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <form className="space-y-4" action={formAction}>
      {"error" in state && state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {state.error}
            {state.error.includes("Passwords do not match") && (
              <div className="mt-2 text-sm">
                <strong>What to do:</strong> Make sure both password fields contain exactly the same text.
              </div>
            )}
            {state.error.includes("Password must be at least 12 characters") && (
              <div className="mt-2 text-sm">
                <strong>What to do:</strong> Create a strong password with at least 12 characters, including uppercase, lowercase, and numbers.
              </div>
            )}
            {state.error.includes("All fields are required") && (
              <div className="mt-2 text-sm">
                <strong>What to do:</strong> Please fill in your full name and create a password to continue.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {"success" in state && state.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="invitationId" value={invitationId} />

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          readOnly
          className="bg-gray-50"
        />
      </div>

      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Enter your full name"
          required
          minLength={2}
          maxLength={50}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a secure password (min. 12 characters)"
          required
          minLength={3}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          required
          minLength={3}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
