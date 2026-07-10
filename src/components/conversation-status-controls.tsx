"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setConversationStatus } from "@/lib/actions/conversations";

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
          onClick={() => startTransition(() => setConversationStatus(conversationId, "ESCALATED"))}
        >
          Escalate to Human
        </Button>
      )}
      {(status === "ESCALATED" || status === "CLOSED") && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
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
