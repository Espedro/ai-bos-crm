"use client";

import { useTransition } from "react";
import { toggleTaskCompleted } from "@/lib/actions/tasks";

export function TaskCheckbox({ id, completed }: { id: string; completed: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      className="size-4 accent-primary"
      defaultChecked={completed}
      disabled={isPending}
      onChange={(e) => {
        const checked = e.target.checked;
        startTransition(() => {
          toggleTaskCompleted(id, checked);
        });
      }}
    />
  );
}
