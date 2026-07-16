import { getConversations } from "@/lib/actions/conversations";
import { ConversationList } from "@/components/conversation-list";
import { PanelHeader } from "@/components/panel-header";
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
  const waiting = conversations.filter((c) => c.status === "ESCALATED").length;

  return (
    <>
      <PanelHeader
        title={channel ? `${CHANNEL_TITLES[channel]} Inbox` : "All Conversations"}
        subtitle="AI triage and human handoff"
        badge={
          waiting > 0 && (
            <span className="inline-flex h-6 shrink-0 items-center border border-[var(--status-critical)]/35 bg-[var(--status-critical)]/10 px-2 text-[11px] font-extrabold whitespace-nowrap text-[var(--status-critical)] uppercase">
              {waiting} waiting
            </span>
          )
        }
      />

      <ConversationList conversations={conversations} activeId={activeId} query={query} />
    </>
  );
}
