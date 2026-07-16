"use client";

import { useTransition } from "react";
import { PanelHeader } from "@/components/panel-header";
import { ConversationDealControl } from "@/components/conversation-deal-control";
import { Button } from "@/components/ui/button";
import { setConversationStatus } from "@/lib/actions/conversations";
import { CHANNEL_TITLES } from "@/lib/channel-ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ConversationChannel, ContactStatus } from "@prisma/client";

const contactStatusLabels: Record<ContactStatus, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  CUSTOMER: "Customer",
};

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted/30 p-2.5">
      <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function nextBestAction(status: string, hasDeals: boolean): string {
  if (status === "ESCALATED") {
    return "Take over the chat and reply to the customer directly — they asked for a human.";
  }
  if (status === "CLOSED") {
    return "This conversation is closed. Resume AI to reopen it, or leave it as-is.";
  }
  if (hasDeals) {
    return "AI is handling this conversation. Check in if the linked deal hasn't moved in a while.";
  }
  return "AI is handling this conversation — no action needed right now.";
}

export function ConversationContextPanel({
  conversationId,
  contact,
  channel,
  assignedAgentName,
  updatedAt,
  status,
  deals,
  stages,
}: {
  conversationId: string;
  contact: { firstName: string; lastName: string; status: ContactStatus; leadScore: number };
  channel: ConversationChannel;
  assignedAgentName?: string;
  updatedAt: Date;
  status: string;
  deals: { id: string; title: string; stageId: string }[];
  stages: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const aiActive = status === "AI_HANDLING";

  return (
    <>
      <PanelHeader title="Customer Context" subtitle="Lead profile and automation state" />

      <div className="border-b p-4">
        <h3 className="mb-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Lead Status
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <InfoTile label="Score" value={String(contact.leadScore)} />
          <InfoTile label="Stage" value={contactStatusLabels[contact.status]} />
          <InfoTile label="Owner" value={assignedAgentName ?? "Unassigned"} />
          <InfoTile label="Source" value={CHANNEL_TITLES[channel]} />
        </div>
      </div>

      {deals.length > 0 && (
        <div className="border-b p-4">
          <h3 className="mb-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Linked Deals
          </h3>
          <ConversationDealControl deals={deals} stages={stages} />
        </div>
      )}

      <div className="border-b p-4">
        <h3 className="mb-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Automation
        </h3>
        <div className="flex items-center justify-between gap-3 border border-border bg-muted/30 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold">AI Employee</p>
            <p className="text-xs text-muted-foreground">
              {aiActive ? "Replying automatically" : "Paused — human is handling this"}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex h-6 shrink-0 items-center border px-2 text-[11px] font-extrabold whitespace-nowrap uppercase",
              aiActive
                ? "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]"
                : "border-[var(--status-serious)]/35 bg-[var(--status-warning)]/15 text-[var(--status-serious)]"
            )}
          >
            {aiActive ? "Active" : "Paused"}
          </span>
        </div>
      </div>

      <div className="border-b p-4">
        <h3 className="mb-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Next Best Action
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">{nextBestAction(status, deals.length > 0)}</p>
        <div className="flex flex-wrap gap-2">
          {status === "AI_HANDLING" ? (
            <Button
              disabled={isPending}
              onClick={() => startTransition(() => setConversationStatus(conversationId, "ESCALATED"))}
            >
              Take Over from AI
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
      </div>

      <div className="p-4">
        <h3 className="mb-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Last Activity
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(updatedAt, { addSuffix: true })}
        </p>
      </div>
    </>
  );
}
