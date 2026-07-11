"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, type RequestResetState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState<RequestResetState, FormData>(
    requestPasswordReset,
    undefined
  );

  if (state?.message && !state.error) {
    return (
      <p className="animate-in rounded-md bg-[var(--status-good)]/10 px-3 py-2 text-sm fade-in-0 text-[var(--status-good)]">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      {state?.message && state.error && (
        <p className="animate-in rounded-md bg-destructive/10 px-3 py-2 text-sm fade-in-0 text-destructive">
          {state.message}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
