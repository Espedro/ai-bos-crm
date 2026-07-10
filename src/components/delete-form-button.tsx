"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteForm } from "@/lib/actions/forms";

export function DeleteFormButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteForm(id);
          if (redirectTo) router.push(redirectTo);
        })
      }
    >
      Delete
    </Button>
  );
}
