"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { EntityAvatar } from "@/components/entity-avatar";
import { LeadScoreBar } from "@/components/lead-score-bar";
import { PanelHeader } from "@/components/panel-header";
import { ChannelIcon } from "@/components/channel-icon";
import { CHANNEL_TITLES } from "@/lib/channel-ui";
import { getContactPreview } from "@/lib/actions/contacts";
import { cn } from "@/lib/utils";
import type { getContacts } from "@/lib/actions/contacts";
import type { ActivityType } from "@prisma/client";

type Contact = Awaited<ReturnType<typeof getContacts>>[number];
type Preview = Awaited<ReturnType<typeof getContactPreview>>;

const BADGE_BASE =
  "inline-flex h-6 items-center gap-1 border px-2 text-[11px] font-extrabold tracking-wide whitespace-nowrap uppercase";

const BADGE_DEFAULT = "border-border bg-muted text-muted-foreground";
const BADGE_BLUE = "border-primary/35 bg-primary/10 text-primary";
const BADGE_GOOD = "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]";
const BADGE_CRITICAL = "border-[var(--status-critical)]/35 bg-[var(--status-critical)]/10 text-[var(--status-critical)]";
const BADGE_PURPLE = "border-[var(--chart-5)]/35 bg-[var(--chart-5)]/10 text-[var(--chart-5)]";

const statusBadge: Record<string, string> = {
  LEAD: BADGE_BLUE,
  QUALIFIED: BADGE_BLUE,
  CUSTOMER: BADGE_BLUE,
};

const sourceBadge: Record<string, string> = {
  WHATSAPP: BADGE_GOOD,
  FACEBOOK: BADGE_BLUE,
  INSTAGRAM: BADGE_PURPLE,
};

const aiStatusBadge: Record<string, string> = {
  AI_HANDLING: BADGE_GOOD,
  ESCALATED: BADGE_CRITICAL,
  CLOSED: BADGE_DEFAULT,
  NONE: BADGE_DEFAULT,
};

function aiStatusLabel(status?: string) {
  if (status === "AI_HANDLING") return "AI Handling";
  if (status === "ESCALATED") return "Needs Human";
  if (status === "CLOSED") return "Closed";
  return "No Conversation";
}

function nextAction(contact: Contact): string {
  const conv = contact.conversations[0];
  if (conv?.status === "ESCALATED") return "Reply to customer";
  if (!contact.assignedAgentId) return "Assign an owner";
  if (contact.status === "LEAD" && conv) return "Follow up on conversation";
  if (!conv && contact._count.formSubmissions === 0) return "Reach out";
  return "—";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  return "Cold";
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  CONTACT_CREATED: "Contact created",
  COMPANY_CREATED: "Company created",
  DEAL_CREATED: "Deal created",
  STAGE_CHANGED: "Stage changed",
  NOTE_ADDED: "Note added",
  TASK_CREATED: "Task created",
  TASK_COMPLETED: "Task completed",
  CONVERSATION_STARTED: "Conversation started",
  CONVERSATION_ESCALATED: "Conversation escalated",
};

export function ContactsWorkspace({
  contacts,
  newContactDialog,
}: {
  contacts: Contact[];
  newContactDialog: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [aiFilter, setAiFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(contacts[0]?.id);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (q) {
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (!name.includes(q) && !c.email?.toLowerCase().includes(q) && !c.company?.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (statusFilter && c.status !== statusFilter) return false;
      if (sourceFilter) {
        const source: string = c.conversations[0]?.channel ?? (c._count.formSubmissions > 0 ? "FORM" : "MANUAL");
        if (source !== sourceFilter) return false;
      }
      if (aiFilter) {
        const status = c.conversations[0]?.status ?? "NONE";
        if (status !== aiFilter) return false;
      }
      if (scoreFilter && scoreLabel(c.leadScore) !== scoreFilter) return false;
      return true;
    });
  }, [contacts, search, statusFilter, sourceFilter, aiFilter, scoreFilter]);

  useEffect(() => {
    if (!selectedId) return;
    const id = selectedId;
    startTransition(async () => {
      const data = await getContactPreview(id);
      setPreview(data);
    });
  }, [selectedId]);

  const selected = contacts.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Lead Intelligence</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Search, score, assign, and inspect every lead from one dense CRM table.
          </p>
        </div>
        {newContactDialog}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or company..."
              className="h-9 border border-input bg-background px-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2 lg:col-span-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 border border-input bg-background px-2 text-xs outline-none"
            >
              <option value="">Status</option>
              <option value="LEAD">Lead</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CUSTOMER">Customer</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-9 border border-input bg-background px-2 text-xs outline-none"
            >
              <option value="">Source</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="FACEBOOK">Messenger</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FORM">Form</option>
              <option value="MANUAL">Manual</option>
            </select>
            <select
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value)}
              className="h-9 border border-input bg-background px-2 text-xs outline-none"
            >
              <option value="">AI Status</option>
              <option value="AI_HANDLING">AI Handling</option>
              <option value="ESCALATED">Needs Human</option>
              <option value="CLOSED">Closed</option>
              <option value="NONE">No Conversation</option>
            </select>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="h-9 border border-input bg-background px-2 text-xs outline-none"
            >
              <option value="">Lead Score</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          <div className="border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {[
                      "Contact",
                      "Source",
                      "Stage",
                      "AI Status",
                      "Lead Score",
                      "Last Interaction",
                      "Owner",
                      "Next Action",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => {
                    const name = `${contact.firstName} ${contact.lastName}`;
                    const conv = contact.conversations[0];
                    const source: string = conv?.channel ?? (contact._count.formSubmissions > 0 ? "FORM" : "MANUAL");
                    const aiStatus = conv?.status ?? "NONE";
                    const active = contact.id === selectedId;
                    return (
                      <tr
                        key={contact.id}
                        onClick={() => setSelectedId(contact.id)}
                        className={cn(
                          "cursor-pointer border-b transition-colors",
                          active ? "bg-primary/5" : "hover:bg-primary/5"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <EntityAvatar name={name} size="sm" />
                            <div className="min-w-0">
                              <Link
                                href={`/contacts/${contact.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="block truncate text-sm font-semibold hover:underline"
                              >
                                {name}
                              </Link>
                              <p className="truncate text-xs text-muted-foreground">
                                {contact.email ?? contact.phone ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {source === "FORM" || source === "MANUAL" ? (
                            <span className={cn(BADGE_BASE, BADGE_DEFAULT)}>
                              {source === "FORM" ? "Form" : "Manual"}
                            </span>
                          ) : (
                            <span className={cn(BADGE_BASE, sourceBadge[source])}>
                              <ChannelIcon channel={source} className="size-3" />
                              {CHANNEL_TITLES[source as "WHATSAPP"]}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(BADGE_BASE, statusBadge[contact.status])}>{contact.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(BADGE_BASE, aiStatusBadge[aiStatus] ?? BADGE_DEFAULT)}>
                            {aiStatusLabel(aiStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <LeadScoreBar score={contact.leadScore} />
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                          {conv ? formatDistanceToNow(conv.updatedAt, { addSuffix: true }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {contact.assignedAgent?.name ?? "Unassigned"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{nextAction(contact)}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/contacts/${contact.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-7 items-center border border-input px-2.5 text-xs font-semibold hover:border-foreground"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-sm text-muted-foreground">No contacts match these filters.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden border border-border bg-card shadow-sm xl:block">
          {!selected ? (
            <div className="p-6 text-sm text-muted-foreground">Select a contact to see details.</div>
          ) : (
            <>
              <PanelHeader
                title="Selected Contact"
                subtitle={`${selected.firstName} ${selected.lastName}`}
                badge={
                  <span className={cn(BADGE_BASE, aiStatusBadge[selected.conversations[0]?.status ?? "NONE"])}>
                    {aiStatusLabel(selected.conversations[0]?.status)}
                  </span>
                }
              />
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <EntityAvatar name={`${selected.firstName} ${selected.lastName}`} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {selected.firstName} {selected.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.assignedAgent ? `Assigned to ${selected.assignedAgent.name}` : "Unassigned"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-border bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">Score</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selected.leadScore} / {scoreLabel(selected.leadScore)}
                    </p>
                  </div>
                  <div className="border border-border bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">Stage</p>
                    <p className="mt-1 text-sm font-semibold">{selected.status}</p>
                  </div>
                  <div className="border border-border bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">Source</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selected.conversations[0]
                        ? CHANNEL_TITLES[selected.conversations[0].channel]
                        : selected._count.formSubmissions > 0
                          ? "Form"
                          : "Manual"}
                    </p>
                  </div>
                  <div className="border border-border bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">Last Touch</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selected.conversations[0]
                        ? formatDistanceToNow(selected.conversations[0].updatedAt, { addSuffix: true })
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="border border-border bg-muted/30 p-3">
                  <h3 className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Suggested Next Action
                  </h3>
                  <p className="text-sm">{nextAction(selected)}</p>
                  {selected.conversations[0]?.status === "ESCALATED" && (
                    <Link
                      href={`/inbox`}
                      className="mt-2 inline-flex h-8 items-center bg-primary px-3 text-xs font-semibold text-primary-foreground"
                    >
                      Open Conversation
                    </Link>
                  )}
                </div>

                <div>
                  <h3 className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Recent Activity
                  </h3>
                  {isPending && <p className="text-xs text-muted-foreground">Loading…</p>}
                  {!isPending && preview && preview.activities.length === 0 && (
                    <p className="text-xs text-muted-foreground">No activity yet.</p>
                  )}
                  {!isPending && preview && (
                    <div className="divide-y border border-border">
                      {preview.activities.map((activity) => (
                        <div key={activity.id} className="px-3 py-2">
                          <p className="text-xs font-semibold">{ACTIVITY_LABELS[activity.type]}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={`/contacts/${selected.id}`}
                  className="flex h-9 items-center justify-center border border-input text-xs font-semibold hover:border-foreground"
                >
                  View Full Profile
                </Link>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
