"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setConversationStatus, assignConversationToSelf } from "@/lib/actions/conversations";

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
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => assignConversationToSelf(conversationId))}
      >
        Assign to Me
      </Button>
      {status !== "CLOSED" && (
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(() => setConversationStatus(conversationId, "CLOSED"))}
        >
          Close
        </Button>
      )}
      {status === "AI_HANDLING" ? (
        <Button
          disabled={isPending}
          onClick={() => startTransition(() => setConversationStatus(conversationId, "ESCALATED"))}
        >
          Take Over
        </Button>
      ) : (
        <Button
          disabled={isPending}
          className="bg-[var(--status-good)] text-white hover:bg-[var(--status-good)]/90"
          onClick={() => startTransition(() => setConversationStatus(conversationId, "AI_HANDLING"))}
        >
          Resume AI
        </Button>
      )}
    </div>
  );
}
