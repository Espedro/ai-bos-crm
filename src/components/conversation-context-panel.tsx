import { PanelHeader } from "@/components/panel-header";
import { ConversationDealControl } from "@/components/conversation-deal-control";
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

export function ConversationContextPanel({
  contact,
  channel,
  assignedAgentName,
  updatedAt,
  status,
  deals,
  stages,
}: {
  contact: { firstName: string; lastName: string; status: ContactStatus; leadScore: number };
  channel: ConversationChannel;
  assignedAgentName?: string;
  updatedAt: Date;
  status: string;
  deals: { id: string; title: string; stageId: string }[];
  stages: { id: string; name: string }[];
}) {
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
              "shrink-0 px-2 py-0.5 text-[11px] font-bold uppercase",
              aiActive
                ? "bg-[var(--status-good)]/15 text-[var(--status-good)]"
                : "bg-[var(--status-warning)]/20 text-[var(--status-serious)]"
            )}
          >
            {aiActive ? "Active" : "Paused"}
          </span>
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
