"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setConversationStatus } from "@/lib/actions/conversations";
import { cn } from "@/lib/utils";

export function ConversationStatusControls({
  conversationId,
  status,
}: {
  conversationId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {status === "AI_HANDLING" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="border-[var(--status-warning)]/40 text-[var(--status-serious)] hover:bg-[var(--status-warning)]/10"
          onClick={() => startTransition(() => setConversationStatus(conversationId, "ESCALATED"))}
        >
          Escalate to Human
        </Button>
      )}
      {(status === "ESCALATED" || status === "CLOSED") && (
        <Button
          size="sm"
          disabled={isPending}
          className={cn(
            "bg-[var(--status-good)] text-white hover:bg-[var(--status-good)]/90"
          )}
          onClick={() => startTransition(() => setConversationStatus(conversationId, "AI_HANDLING"))}
        >
          Resume AI
        </Button>
      )}
      {status !== "CLOSED" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => setConversationStatus(conversationId, "CLOSED"))}
        >
          Close
        </Button>
      )}
    </div>
  );
}
