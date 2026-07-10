"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importResourcesFromWebsite, type ImportWebsiteState } from "@/lib/actions/resources";

export function ImportWebsiteDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prevState: ImportWebsiteState, formData: FormData) => {
    const result = await importResourcesFromWebsite(prevState, formData);
    if (result?.message.startsWith("Imported")) setOpen(false);
    return result;
  }, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Import from Website</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Website</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll read the page and pull out products, pricing, and FAQs for the AI
              Employee to use.
            </p>
          </div>
          {state?.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Importing…" : "Import"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
