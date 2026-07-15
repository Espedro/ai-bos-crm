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
      <div className="shrink-0 border-b bg-muted/40 px-4 py-3">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {channel ? CHANNEL_TITLES[channel] : "All Conversations"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
        </p>
      </div>

      <ConversationList conversations={conversations} activeId={activeId} query={query} />
    </>
  );
}
