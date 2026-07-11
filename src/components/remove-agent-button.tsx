"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteAgent } from "@/lib/actions/agents";

export function RemoveAgentButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={`Remove ${agentName}`}
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Remove ${agentName} from the team? They'll no longer be able to sign in.`)) {
          return;
        }
        startTransition(async () => {
          try {
            await deleteAgent(agentId);
          } catch (error) {
            alert(error instanceof Error ? error.message : "Couldn't remove this team member.");
          }
        });
      }}
      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
