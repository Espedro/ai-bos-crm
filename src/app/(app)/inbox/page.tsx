import { MessageCircle } from "lucide-react";
import { InboxShell } from "@/components/inbox-shell";
import { ConversationListPane } from "@/components/conversation-list-pane";
import { parseChannelParam } from "@/lib/channel-ui";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const { channel: channelParam } = await searchParams;
  const channel = parseChannelParam(channelParam);

  return (
    <InboxShell list={<ConversationListPane channel={channel} />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
        <MessageCircle className="size-8" />
        <p className="text-sm">Please select a thread to start messaging.</p>
      </div>
    </InboxShell>
  );
}
