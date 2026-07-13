"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateBusinessProfile, type UpdateBusinessProfileState } from "@/lib/actions/business";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function BusinessProfileForm({ name, slug }: { name: string; slug: string }) {
  const [state, formAction] = useActionState<UpdateBusinessProfileState, FormData>(
    updateBusinessProfile,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Login slug</Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="shrink-0">/login/</span>
          <Input id="slug" name="slug" defaultValue={slug} required className="max-w-xs" />
        </div>
        <p className="text-xs text-muted-foreground">
          Changing this changes your team&apos;s sign-in link immediately — any bookmarked link
          to the old one will stop working.
        </p>
      </div>
      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-[var(--status-good)]/10 px-3 py-2 text-sm text-[var(--status-good)]">
          Saved.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
