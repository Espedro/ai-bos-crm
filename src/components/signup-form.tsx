"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signup, type SignupState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating workspace…" : "Create workspace"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<SignupState, FormData>(signup, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business name</Label>
        <Input id="businessName" name="businessName" autoComplete="organization" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Your email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state?.error && (
        <p className="animate-in rounded-md bg-destructive/10 px-3 py-2 text-sm fade-in-0 text-destructive">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll be the first admin — choose your password on the next screen.
      </p>
    </form>
  );
}
