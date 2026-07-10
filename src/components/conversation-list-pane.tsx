import Link from "next/link";
import { getConversations } from "@/lib/actions/conversations";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/entity-avatar";
import { ChannelIcon } from "@/components/channel-icon";
import { CHANNEL_TITLES } from "@/lib/channel-ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ConversationChannel } from "@prisma/client";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  AI_HANDLING: "secondary",
  ESCALATED: "destructive",
  CLOSED: "outline",
};

export async function ConversationListPane({
  channel,
  activeId,
}: {
  channel?: ConversationChannel;
  activeId?: string;
}) {
  const conversations = await getConversations(channel);
  const query = channel ? `?channel=${channel}` : "";

  return (
    <>
      <div className="shrink-0 border-b px-4 py-4">
        <h1 className="text-lg font-bold tracking-tight">
          {channel ? CHANNEL_TITLES[channel] : "All Conversations"}
        </h1>
        <p className="text-xs text-muted-foreground">
          {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
        </p>
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto">
        {conversations.map((conversation) => {
          const lastMessage = conversation.messages[0];
          const active = conversation.id === activeId;
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
                <EntityAvatar
                  name={`${conversation.contact.firstName} ${conversation.contact.lastName}`}
                  size="sm"
                />
                <ChannelIcon
                  channel={conversation.channel}
                  className="absolute -right-1 -bottom-1 size-4 ring-2 ring-background"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {conversation.contact.firstName} {conversation.contact.lastName}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(conversation.updatedAt, { addSuffix: false })}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {lastMessage ? lastMessage.body : "No messages yet"}
                </p>
                <Badge variant={statusVariant[conversation.status]} className="mt-1.5">
                  {conversation.status.replace("_", " ")}
                </Badge>
              </div>
            </Link>
          );
        })}
        {conversations.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No conversations yet.</p>
        )}
      </div>
    </>
  );
}
