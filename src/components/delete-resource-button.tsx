"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteResource } from "@/lib/actions/resources";

export function DeleteResourceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => deleteResource(id))}
    >
      Delete
    </Button>
  );
}
