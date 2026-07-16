"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NoteForm } from "@/components/note-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendAgentMessage, getSuggestedReply } from "@/lib/actions/conversations";

type Option = { id: string; name: string };

export function AgentMessageForm({
  conversationId,
  contactId,
  agents,
}: {
  conversationId: string;
  contactId: string;
  agents: Option[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [body, setBody] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const reply = await getSuggestedReply(conversationId);
      setSuggestion(reply);
    });
  }, [conversationId]);

  return (
    <div className="space-y-2">
      {isPending && !suggestion && (
        <p className="px-1 text-xs text-muted-foreground">Drafting a suggested reply…</p>
      )}
      {suggestion && (
        <div className="border border-[var(--chart-2)]/30 bg-[var(--chart-2)]/8 p-3">
          <p className="text-sm">
            <span className="font-extrabold tracking-wide text-[var(--chart-2)] uppercase">
              Suggested reply:
            </span>{" "}
            {suggestion}
          </p>
        </div>
      )}

      {showNote && (
        <div className="border bg-muted/30 p-3">
          <NoteForm contactId={contactId} agents={agents} />
        </div>
      )}

      <form
        ref={formRef}
        action={async (formData) => {
          const text = String(formData.get("body") ?? "");
          const agentId = String(formData.get("agentId") ?? "") || undefined;
          setBody("");
          formRef.current?.reset();
          await sendAgentMessage(conversationId, text, agentId);
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <Button type="button" variant="outline" onClick={() => setShowNote((v) => !v)}>
          Note
        </Button>
        <Textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          required
          rows={1}
          className="flex-1"
        />
        {suggestion && (
          <Button type="button" variant="outline" onClick={() => setBody(suggestion)}>
            Use AI Reply
          </Button>
        )}
        <Select name="agentId">
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="You" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
