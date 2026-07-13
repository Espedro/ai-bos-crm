"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createStage, renameStage, deleteStage, moveStage } from "@/lib/actions/deals";

type Stage = { id: string; name: string; order: number; _count: { deals: number } };

function StageRow({
  stage,
  isFirst,
  isLast,
}: {
  stage: Stage;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [name, setName] = useState(stage.name);
  const [isPending, startTransition] = useTransition();

  function commitRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === stage.name) {
      setName(stage.name);
      return;
    }
    startTransition(() => renameStage(stage.id, trimmed));
  }

  function handleDelete() {
    if (stage._count.deals > 0) {
      alert(
        `Move or delete the ${stage._count.deals} deal(s) in "${stage.name}" before removing this stage.`
      );
      return;
    }
    if (!confirm(`Delete stage "${stage.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteStage(stage.id);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Couldn't delete this stage.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          aria-label="Move up"
          disabled={isFirst || isPending}
          onClick={() => startTransition(() => moveStage(stage.id, "up"))}
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowUp className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={isLast || isPending}
          onClick={() => startTransition(() => moveStage(stage.id, "down"))}
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowDown className="size-3.5" />
        </button>
      </div>
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={commitRename}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        disabled={isPending}
        className="max-w-xs"
      />
      <span className="shrink-0 text-xs text-muted-foreground">
        {stage._count.deals} deal{stage._count.deals === 1 ? "" : "s"}
      </span>
      <button
        type="button"
        aria-label={`Delete ${stage.name}`}
        disabled={isPending}
        onClick={handleDelete}
        className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </div>
  );
}

export function StageManager({ stages }: { stages: Stage[] }) {
  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border">
        {stages.map((stage, index) => (
          <StageRow
            key={stage.id}
            stage={stage}
            isFirst={index === 0}
            isLast={index === stages.length - 1}
          />
        ))}
        {stages.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No stages yet.</p>
        )}
      </div>

      <form action={createStage} className="flex gap-2">
        <Input name="name" placeholder="New stage name" required className="max-w-xs" />
        <Button type="submit">Add stage</Button>
      </form>
    </div>
  );
}
