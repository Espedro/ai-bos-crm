import { getConversations } from "@/lib/actions/conversations";
import { ConversationList } from "@/components/conversation-list";
import { CHANNEL_TITLES } from "@/lib/channel-ui";
import type { ConversationChannel } from "@prisma/client";

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

      <ConversationList conversations={conversations} activeId={activeId} query={query} />
    </>
  );
}
