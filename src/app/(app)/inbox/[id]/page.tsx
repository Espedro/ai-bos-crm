import { notFound } from "next/navigation";
import Link from "next/link";
import { getConversation, getConversations } from "@/lib/actions/conversations";
import { getAgents } from "@/lib/actions/agents";
import { getStages } from "@/lib/actions/deals";
import { EntityAvatar } from "@/components/entity-avatar";
import { ConversationStatusControls } from "@/components/conversation-status-controls";
import { ConversationContextPanel } from "@/components/conversation-context-panel";
import { CustomerMessageForm } from "@/components/customer-message-form";
import { AgentMessageForm } from "@/components/agent-message-form";
import { InboxShell } from "@/components/inbox-shell";
import { ConversationListPane } from "@/components/conversation-list-pane";
import { PageShell } from "@/components/page-shell";
import { CHANNEL_TITLES, parseChannelParam } from "@/lib/channel-ui";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { ArrowLeft } from "lucide-react";
import type { Message } from "@prisma/client";

const bubbleStyles: Record<string, string> = {
  CUSTOMER: "border-border bg-card text-foreground",
  AI: "border-[var(--status-good)]/30 bg-[var(--status-good)]/8 text-foreground",
  AGENT: "border-primary/30 bg-primary/8 text-foreground",
};

const senderLabels: Record<string, string> = {
  CUSTOMER: "Customer",
  AI: "AI Assistant",
  AGENT: "Agent",
};

const BADGE_BASE =
  "inline-flex h-6 items-center gap-1 border px-2 text-[11px] font-extrabold tracking-wide whitespace-nowrap uppercase";

const BADGE_DEFAULT = "border-border bg-muted text-muted-foreground";

const contactStatusLabels: Record<string, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  CUSTOMER: "Customer",
};

const contactStatusClasses: Record<string, string> = {
  LEAD: "border-[var(--status-serious)]/35 bg-[var(--status-warning)]/15 text-[var(--status-serious)]",
  QUALIFIED: "border-[var(--chart-5)]/35 bg-[var(--chart-5)]/10 text-[var(--chart-5)]",
  CUSTOMER: "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]",
};

const conversationStatusLabels: Record<string, string> = {
  AI_HANDLING: "AI Handling",
  ESCALATED: "Escalated",
  CLOSED: "Closed",
};

const conversationStatusClasses: Record<string, string> = {
  AI_HANDLING: "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]",
  ESCALATED: "border-[var(--status-critical)]/35 bg-[var(--status-critical)]/10 text-[var(--status-critical)]",
  CLOSED: BADGE_DEFAULT,
};

type ThreadItem =
  | { type: "date"; key: string; date: Date }
  | { type: "message"; key: string; message: Message };

function buildThread(messages: Message[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDayKey: string | null = null;

  for (const message of messages) {
    const dayKey = format(message.createdAt, "yyyy-MM-dd");
    if (dayKey !== lastDayKey) {
      items.push({ type: "date", key: `date-${dayKey}`, date: message.createdAt });
      lastDayKey = dayKey;
    }
    items.push({ type: "message", key: message.id, message });
  }
  return items;
}

function dateSeparatorLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export default async function ConversationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ channel?: string }>;
}) {
  const { id } = await params;
  const { channel: channelParam } = await searchParams;
  const channel = parseChannelParam(channelParam);
  const [conversation, agents, stages, conversations] = await Promise.all([
    getConversation(id),
    getAgents(),
    getStages(),
    getConversations(channel),
  ]);

  if (!conversation) notFound();

  const contactName = `${conversation.contact.firstName} ${conversation.contact.lastName}`;
  const thread = buildThread(conversation.messages);

  const backHref = `/inbox${channel ? `?channel=${channel}` : ""}`;

  return (
    <PageShell
      kicker={`${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}
      title={`AI Inbox / ${CHANNEL_TITLES[conversation.channel]}`}
    >
    <InboxShell
      list={<ConversationListPane channel={channel} activeId={id} />}
      context={
        <ConversationContextPanel
          conversationId={conversation.id}
          contact={conversation.contact}
          channel={conversation.channel}
          assignedAgentName={conversation.assignedAgent?.name}
          updatedAt={conversation.updatedAt}
          status={conversation.status}
          deals={conversation.contact.deals}
          stages={stages}
        />
      }
      hasActive
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-y-2 border-b px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={backHref}
            aria-label="Back to conversations"
            className="-ml-1 flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground sm:hidden"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <EntityAvatar name={contactName} />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">
              <Link href={`/contacts/${conversation.contact.id}`} className="hover:underline">
                {contactName}
              </Link>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={cn(BADGE_BASE, BADGE_DEFAULT)}>{conversation.channel}</span>
              <span className={cn(BADGE_BASE, conversationStatusClasses[conversation.status])}>
                {conversationStatusLabels[conversation.status]}
              </span>
              <span className={cn(BADGE_BASE, contactStatusClasses[conversation.contact.status])}>
                {contactStatusLabels[conversation.contact.status]}
              </span>
              {conversation.assignedAgent && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <EntityAvatar name={conversation.assignedAgent.name} size="sm" />
                  {conversation.assignedAgent.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <ConversationStatusControls conversationId={conversation.id} status={conversation.status} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 sm:px-5">
        {thread.map((item) => {
          if (item.type === "date") {
            return (
              <div key={item.key} className="my-3 flex items-center justify-center">
                <span className="bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {dateSeparatorLabel(item.date)}
                </span>
              </div>
            );
          }

          const { message } = item;
          const isCustomer = message.sender === "CUSTOMER";

          return (
            <div key={item.key} className={cn("mt-3.5 flex", isCustomer ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[85%] border px-3 py-2.5 shadow-sm sm:max-w-[72%]", bubbleStyles[message.sender])}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
                  <span>{senderLabels[message.sender]}</span>
                  <span>{format(message.createdAt, "p")}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
              </div>
            </div>
          );
        })}
        {conversation.messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No messages yet. Send one below to simulate the customer starting the conversation.
          </p>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t px-3 py-3 sm:px-5 sm:py-4">
        {conversation.status === "ESCALATED" ? (
          <AgentMessageForm
            conversationId={conversation.id}
            contactId={conversation.contact.id}
            agents={agents}
          />
        ) : (
          <CustomerMessageForm conversationId={conversation.id} />
        )}
      </div>
    </InboxShell>
    </PageShell>
  );
}
