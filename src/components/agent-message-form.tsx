"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendAgentMessage } from "@/lib/actions/conversations";

type Option = { id: string; name: string };

export function AgentMessageForm({
  conversationId,
  agents,
}: {
  conversationId: string;
  agents: Option[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const body = String(formData.get("body") ?? "");
        const agentId = String(formData.get("agentId") ?? "") || undefined;
        formRef.current?.reset();
        await sendAgentMessage(conversationId, body, agentId);
      }}
      className="space-y-2 rounded-lg border bg-muted/30 p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">Reply as agent</p>
      <div className="flex items-end gap-2">
        <Textarea name="body" placeholder="Type your reply..." required rows={2} className="flex-1" />
        <div className="flex flex-col gap-2">
          <Select name="agentId">
            <SelectTrigger className="w-[160px]">
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
          <Button type="submit">Send as Agent</Button>
        </div>
      </div>
    </form>
  );
}
