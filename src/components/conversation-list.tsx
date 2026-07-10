"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/entity-avatar";
import { ChannelIcon } from "@/components/channel-icon";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import type { getConversations } from "@/lib/actions/conversations";

type Conversation = Awaited<ReturnType<typeof getConversations>>[number];

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  AI_HANDLING: "secondary",
  ESCALATED: "destructive",
  CLOSED: "outline",
};

const contactStatusClasses: Record<string, string> = {
  LEAD: "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
  QUALIFIED: "bg-[var(--chart-5)]/15 text-[var(--chart-5)]",
  CUSTOMER: "bg-[var(--status-good)]/15 text-[var(--status-good)]",
};

export function ConversationList({
  conversations,
  activeId,
  query,
}: {
  conversations: Conversation[];
  activeId?: string;
  query: string;
}) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      const name = `${conversation.contact.firstName} ${conversation.contact.lastName}`.toLowerCase();
      const preview = conversation.messages[0]?.body?.toLowerCase() ?? "";
      return name.includes(q) || preview.includes(q);
    });
  }, [filter, conversations]);

  return (
    <>
      <div className="shrink-0 border-b px-3 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or message..."
            className="h-8 w-full rounded-md border border-input bg-background pr-2 pl-8 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto">
        {filtered.map((conversation) => {
          const lastMessage = conversation.messages[0];
          const active = conversation.id === activeId;
          const contactName = `${conversation.contact.firstName} ${conversation.contact.lastName}`;
          return (
            <Link
              key={conversation.id}
              href={`/inbox/${conversation.id}${query}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors",
                active ? "bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              <div className="relative shrink-0">
                <EntityAvatar name={contactName} size="sm" />
                <ChannelIcon
                  channel={conversation.channel}
                  className="absolute -right-1 -bottom-1 size-4 ring-2 ring-background"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{contactName}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {lastMessage ? lastMessage.body : "No messages yet"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusVariant[conversation.status]}>
                    {conversation.status.replace("_", " ")}
                  </Badge>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      contactStatusClasses[conversation.contact.status]
                    )}
                  >
                    {conversation.contact.status}
                  </span>
                  {conversation.assignedAgent && (
                    <span className="text-[10px] text-muted-foreground">
                      {conversation.assignedAgent.name}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && conversations.length > 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No conversations match &ldquo;{filter}&rdquo;.
          </p>
        )}
        {conversations.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No conversations yet.</p>
        )}
      </div>
    </>
  );
}
