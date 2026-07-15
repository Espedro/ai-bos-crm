import { MessageCircle } from "lucide-react";
import { InboxShell } from "@/components/inbox-shell";
import { ConversationListPane } from "@/components/conversation-list-pane";
import { PageShell } from "@/components/page-shell";
import { getConversations } from "@/lib/actions/conversations";
import { CHANNEL_TITLES, parseChannelParam } from "@/lib/channel-ui";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const { channel: channelParam } = await searchParams;
  const channel = parseChannelParam(channelParam);
  const conversations = await getConversations(channel);
  const label = channel ? CHANNEL_TITLES[channel] : "All Channels";

  return (
    <PageShell
      kicker={`${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}
      title={`AI Inbox / ${label}`}
    >
      <InboxShell list={<ConversationListPane channel={channel} />}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <MessageCircle className="size-8" />
          <p className="text-sm">Please select a thread to start messaging.</p>
        </div>
      </InboxShell>
    </PageShell>
  );
}
