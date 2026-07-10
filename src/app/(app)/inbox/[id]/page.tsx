import { notFound } from "next/navigation";
import Link from "next/link";
import { getConversation } from "@/lib/actions/conversations";
import { getAgents } from "@/lib/actions/agents";
import { Badge } from "@/components/ui/badge";
import { ConversationStatusControls } from "@/components/conversation-status-controls";
import { CustomerMessageForm } from "@/components/customer-message-form";
import { AgentMessageForm } from "@/components/agent-message-form";
import { InboxShell } from "@/components/inbox-shell";
import { ConversationListPane } from "@/components/conversation-list-pane";
import { parseChannelParam } from "@/lib/channel-ui";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const senderStyles: Record<string, string> = {
  CUSTOMER: "bg-muted text-foreground self-start",
  AI: "bg-primary/10 text-foreground self-start border border-primary/20",
  AGENT: "bg-primary text-primary-foreground self-end",
};

const senderLabels: Record<string, string> = {
  CUSTOMER: "Customer",
  AI: "AI Employee",
  AGENT: "Agent",
};

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

  return (
    <InboxShell list={<ConversationListPane channel={channel} activeId={id} />}>
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            <Link href={`/contacts/${conversation.contact.id}`} className="hover:underline">
              {conversation.contact.firstName} {conversation.contact.lastName}
            </Link>
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{conversation.channel}</Badge>
            <Badge variant="secondary">{conversation.status.replace("_", " ")}</Badge>
          </div>
        </div>
        <ConversationStatusControls conversationId={conversation.id} status={conversation.status} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[75%] rounded-lg px-3 py-2 text-sm",
              senderStyles[message.sender]
            )}
          >
            <p className="mb-1 text-xs font-medium opacity-70">
              {senderLabels[message.sender]} · {format(message.createdAt, "p")}
            </p>
            <p className="whitespace-pre-wrap">{message.body}</p>
          </div>
        ))}
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
