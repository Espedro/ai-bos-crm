"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EntityAvatar } from "@/components/entity-avatar";
import { ChannelIcon } from "@/components/channel-icon";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Search, X } from "lucide-react";
import type { getConversations } from "@/lib/actions/conversations";

type Conversation = Awaited<ReturnType<typeof getConversations>>[number];

const BADGE_BASE =
  "inline-flex h-6 items-center gap-1 border px-2 text-[11px] font-extrabold tracking-wide whitespace-nowrap uppercase";

const BADGE_DEFAULT = "border-border bg-muted text-muted-foreground";

const statusClasses: Record<string, string> = {
  AI_HANDLING: "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]",
  ESCALATED: "border-[var(--status-critical)]/35 bg-[var(--status-critical)]/10 text-[var(--status-critical)]",
  CLOSED: BADGE_DEFAULT,
};

const statusLabels: Record<string, string> = {
  AI_HANDLING: "AI Handling",
  ESCALATED: "Escalated",
  CLOSED: "Closed",
};

const contactStatusClasses: Record<string, string> = {
  LEAD: "border-[var(--status-serious)]/35 bg-[var(--status-warning)]/15 text-[var(--status-serious)]",
  QUALIFIED: "border-[var(--chart-5)]/35 bg-[var(--chart-5)]/10 text-[var(--chart-5)]",
  CUSTOMER: "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]",
};

const contactStatusLabels: Record<string, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  CUSTOMER: "Customer",
};

const TABS = [
  { key: "ALL", label: "All" },
  { key: "ESCALATED", label: "Needs Human" },
  { key: "AI_HANDLING", label: "AI Handling" },
  { key: "CLOSED", label: "Closed" },
] as const;

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
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ALL");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (tab !== "ALL" && conversation.status !== tab) return false;
      if (!q) return true;
      const name = `${conversation.contact.firstName} ${conversation.contact.lastName}`.toLowerCase();
      const preview = conversation.messages[0]?.body?.toLowerCase() ?? "";
      return name.includes(q) || preview.includes(q);
    });
  }, [filter, tab, conversations]);

  return (
    <>
      <div className="flex shrink-0 items-center overflow-x-auto border-b">
        {TABS.map((t) => {
          const count = t.key === "ALL" ? conversations.length : conversations.filter((c) => c.status === t.key).length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex h-10 shrink-0 items-center justify-center gap-1 border-r px-3 text-[12px] font-extrabold whitespace-nowrap uppercase",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="shrink-0 border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && filter) {
                e.preventDefault();
                setFilter("");
              }
            }}
            placeholder="Search message or contact..."
            className="h-[38px] w-full border border-input bg-muted/30 pr-7 pl-8 text-xs outline-none placeholder:text-muted-foreground transition-shadow focus-visible:border-primary focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
          />
          {filter && (
            <button
              type="button"
              onClick={() => {
                setFilter("");
                inputRef.current?.focus();
              }}
              aria-label="Clear filter"
              className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors animate-in fade-in-0 zoom-in-95 duration-150 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
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
                "block animate-in border-b px-3 py-[13px] fade-in-0 transition-colors duration-150",
                active ? "bg-primary/5" : "hover:bg-primary/5"
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative shrink-0">
                    <EntityAvatar name={contactName} size="sm" />
                    <ChannelIcon
                      channel={conversation.channel}
                      className="absolute -right-1 -bottom-1 size-4 ring-2 ring-background"
                    />
                  </div>
                  <p className="truncate text-sm font-semibold">{contactName}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                </span>
              </div>
              <p className="mb-2.5 truncate text-xs text-muted-foreground">
                {lastMessage ? lastMessage.body : "No messages yet"}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn(BADGE_BASE, statusClasses[conversation.status])}>
                  {statusLabels[conversation.status]}
                </span>
                <span className={cn(BADGE_BASE, contactStatusClasses[conversation.contact.status])}>
                  {contactStatusLabels[conversation.contact.status]}
                </span>
                {conversation.assignedAgent && (
                  <span className={cn(BADGE_BASE, "border-primary/35 bg-primary/10 text-primary")}>
                    {conversation.assignedAgent.name}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && conversations.length > 0 && (
          <p className="animate-in px-4 py-6 fade-in-0 text-sm text-muted-foreground">
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
