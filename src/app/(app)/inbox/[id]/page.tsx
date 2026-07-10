import { notFound } from "next/navigation";
import Link from "next/link";
import { getConversation } from "@/lib/actions/conversations";
import { getAgents } from "@/lib/actions/agents";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/entity-avatar";
import { ConversationStatusControls } from "@/components/conversation-status-controls";
import { CustomerMessageForm } from "@/components/customer-message-form";
import { AgentMessageForm } from "@/components/agent-message-form";
import { InboxShell } from "@/components/inbox-shell";
import { ConversationListPane } from "@/components/conversation-list-pane";
import { parseChannelParam } from "@/lib/channel-ui";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { Bot } from "lucide-react";
import type { Message } from "@prisma/client";

const bubbleStyles: Record<string, string> = {
  CUSTOMER: "bg-muted text-foreground",
  AI: "bg-primary/10 text-foreground border border-primary/20",
  AGENT: "bg-primary text-primary-foreground",
};

const senderLabels: Record<string, string> = {
  CUSTOMER: "Customer",
  AI: "AI Employee",
  AGENT: "Agent",
};

const contactStatusLabels: Record<string, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  CUSTOMER: "Customer",
};

const contactStatusClasses: Record<string, string> = {
  LEAD: "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
  QUALIFIED: "bg-[var(--chart-5)]/15 text-[var(--chart-5)]",
  CUSTOMER: "bg-[var(--status-good)]/15 text-[var(--status-good)]",
};

type MessageGroup = { sender: string; messages: Message[] };
type ThreadItem =
  | { type: "date"; key: string; date: Date }
  | { type: "group"; key: string; group: MessageGroup };

function buildThread(messages: Message[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDayKey: string | null = null;
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    const dayKey = format(message.createdAt, "yyyy-MM-dd");
    if (dayKey !== lastDayKey) {
      items.push({ type: "date", key: `date-${dayKey}`, date: message.createdAt });
      lastDayKey = dayKey;
      currentGroup = null;
    }
    if (currentGroup && currentGroup.sender === message.sender) {
      currentGroup.messages.push(message);
    } else {
      currentGroup = { sender: message.sender, messages: [message] };
      items.push({ type: "group", key: `group-${message.id}`, group: currentGroup });
    }
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
  const [conversation, agents] = await Promise.all([getConversation(id), getAgents()]);

  if (!conversation) notFound();

  const contactName = `${conversation.contact.firstName} ${conversation.contact.lastName}`;
  const thread = buildThread(conversation.messages);

  return (
    <InboxShell list={<ConversationListPane channel={channel} activeId={id} />}>
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <EntityAvatar name={contactName} />
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              <Link href={`/contacts/${conversation.contact.id}`} className="hover:underline">
                {contactName}
              </Link>
            </h1>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="outline">{conversation.channel}</Badge>
              <Badge variant="secondary">{conversation.status.replace("_", " ")}</Badge>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  contactStatusClasses[conversation.contact.status]
                )}
              >
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

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 py-4">
        {thread.map((item) => {
          if (item.type === "date") {
            return (
              <div key={item.key} className="my-3 flex items-center justify-center">
                <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {dateSeparatorLabel(item.date)}
                </span>
              </div>
            );
          }

          const { sender, messages } = item.group;
          const isCustomer = sender === "CUSTOMER";
          const avatar =
            sender === "CUSTOMER" ? (
              <EntityAvatar name={contactName} size="sm" />
            ) : sender === "AGENT" ? (
              <EntityAvatar name={conversation.assignedAgent?.name ?? "Agent"} size="sm" />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" />
              </div>
            );

          return (
            <div key={item.key} className={cn("mt-3 flex", isCustomer ? "justify-start" : "justify-end")}>
              <div className={cn("flex items-end gap-2", !isCustomer && "flex-row-reverse")}>
                {avatar}
                <div className={cn("flex max-w-[420px] flex-col gap-0.5", !isCustomer && "items-end")}>
                  <p className="px-1 text-xs font-medium text-muted-foreground">
                    {senderLabels[sender]} · {format(messages[0].createdAt, "p")}
                  </p>
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm",
                        bubbleStyles[sender],
                        index === messages.length - 1 &&
                          (isCustomer ? "rounded-bl-md" : "rounded-br-md")
                      )}
                    >
                      {message.body}
                    </div>
                  ))}
                </div>
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

      <div className="shrink-0 space-y-3 border-t px-5 py-4">
        <CustomerMessageForm conversationId={conversation.id} />
        {conversation.status === "ESCALATED" && (
          <AgentMessageForm conversationId={conversation.id} agents={agents} />
        )}
      </div>
    </InboxShell>
  );
}
