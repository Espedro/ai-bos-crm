import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDealsByStage } from "@/lib/actions/deals";
import { getLeadTrend, getAvgFirstReplySeconds } from "@/lib/actions/dashboard";
import { getRecentActivity } from "@/lib/activity";
import { getCurrentAgent } from "@/lib/current-agent";
import { Card } from "@/components/ui/card";
import { EntityAvatar } from "@/components/entity-avatar";
import { PanelHeader } from "@/components/panel-header";
import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";
import { PipelineValueChart } from "@/components/dashboard/pipeline-value-chart";
import { LeadTrendSparkline } from "@/components/dashboard/lead-trend-sparkline";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { formatDistanceToNow } from "date-fns";

function weekOverWeek(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

const TONE_CLASSES: Record<"good" | "warn" | "bad", string> = {
  good: "text-[var(--status-good)]",
  warn: "text-[var(--status-serious)]",
  bad: "text-[var(--status-critical)]",
};

function StatCard({
  label,
  value,
  caption,
  changeLabel,
  tone,
  chart,
}: {
  label: string;
  value: number | string;
  caption: string;
  changeLabel: string;
  tone: "good" | "warn" | "bad";
  chart?: React.ReactNode;
}) {
  return (
    <Card className="min-h-[124px] justify-between gap-0 py-4">
      <div className="px-4">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-2.5 text-[28px] font-bold tracking-tight tabular-nums">{value}</p>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 px-4 text-xs">
        <span className="text-muted-foreground">{caption}</span>
        <span className={cn("font-extrabold uppercase", TONE_CLASSES[tone])}>{changeLabel}</span>
      </div>
      {chart && <div className="-mb-1 px-1">{chart}</div>}
    </Card>
  );
}

const BADGE_BASE =
  "inline-flex h-6 items-center gap-1 border px-2 text-[11px] font-extrabold tracking-wide whitespace-nowrap uppercase";
const BADGE_DEFAULT = "border-border bg-muted text-muted-foreground";
const BADGE_BLUE = "border-primary/35 bg-primary/10 text-primary";
const BADGE_GOOD = "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]";
const BADGE_WARN = "border-[var(--status-serious)]/35 bg-[var(--status-warning)]/15 text-[var(--status-serious)]";
const BADGE_CRITICAL = "border-[var(--status-critical)]/35 bg-[var(--status-critical)]/10 text-[var(--status-critical)]";

const stageBadgeClasses: Record<string, string> = {
  won: "bg-[var(--status-good)] text-white",
  lost: "bg-[var(--status-critical)] text-white",
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Messenger",
  INSTAGRAM: "Instagram",
};

const connectionBadge: Record<string, string> = {
  CONNECTED: BADGE_GOOD,
  ERROR: BADGE_CRITICAL,
  DISCONNECTED: BADGE_DEFAULT,
};

function stageBarColor(stageName: string): string {
  const name = stageName.toLowerCase();
  if (name === "won") return "bg-[var(--status-good)]";
  if (name === "lost") return "bg-[var(--status-critical)]";
  return "bg-primary";
}

export default async function DashboardPage() {
  const agent = await getCurrentAgent();
  const isAdmin = agent.role === "ADMIN";
  const businessId = agent.businessId;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    leadCount,
    stages,
    tasksOverdue,
    activeConversations,
    escalatedConversations,
    leadsThisWeek,
    leadsPrevWeek,
    leadTrend,
    avgFirstReplySeconds,
    recentActivity,
    channelConnections,
    escalatedList,
    unassignedDealsCount,
    unassignedContactsCount,
    formsCount,
    resourcesCount,
    business,
  ] = await Promise.all([
    prisma.contact.count({ where: { businessId, status: "LEAD" } }),
    getDealsByStage(),
    prisma.task.count({
      where: { businessId, completed: false, dueDate: { lt: startOfToday } },
    }),
    prisma.conversation.count({ where: { businessId, status: { not: "CLOSED" } } }),
    prisma.conversation.count({ where: { businessId, status: "ESCALATED" } }),
    prisma.contact.count({
      where: { businessId, status: "LEAD", createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.contact.count({
      where: { businessId, status: "LEAD", createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    getLeadTrend(14),
    getAvgFirstReplySeconds(7),
    getRecentActivity(businessId, 8),
    prisma.channelConnection.findMany({
      where: { businessId, channel: { in: ["WHATSAPP", "FACEBOOK", "INSTAGRAM"] } },
    }),
    prisma.conversation.findMany({
      where: { businessId, status: "ESCALATED" },
      include: { contact: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.deal.count({ where: { businessId, assignedAgentId: null } }),
    prisma.contact.count({ where: { businessId, assignedAgentId: null } }),
    prisma.form.count({ where: { businessId } }),
    prisma.businessResource.count({ where: { businessId } }),
    prisma.business.findUnique({ where: { id: businessId }, select: { emailFromAddress: true } }),
  ]);

  const openStages = stages.filter((s) => s.name !== "Won" && s.name !== "Lost");
  const openDeals = openStages.reduce((sum, s) => sum + s.deals.length, 0);
  const pipelineValue = openStages.reduce(
    (sum, s) => sum + s.deals.reduce((dSum, d) => dSum + Number(d.value), 0),
    0
  );

  const stageValueData = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    value: stage.deals.reduce((sum, d) => sum + Number(d.value), 0),
    count: stage.deals.length,
  }));

  const maxStageCount = Math.max(1, ...stages.map((s) => s.deals.length));

  const leadsTrendPct = weekOverWeek(leadsThisWeek, leadsPrevWeek);

  const recentDeals = stages
    .flatMap((s) => s.deals.map((d) => ({ ...d, stageName: s.name })))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 4);

  const staleDeals = openStages
    .flatMap((s) => s.deals)
    .filter((d) => d.updatedAt < sixDaysAgo);

  const aiHandling = activeConversations - escalatedConversations;
  const anyChannelConnected = channelConnections.some((c) => c.status === "CONNECTED");
  const failedConnectionsCount = channelConnections.filter((c) => c.status === "ERROR").length;

  const recommendations = [
    unassignedContactsCount > 0 && {
      key: "assign",
      title: "Assign unassigned leads",
      caption: `${unassignedContactsCount} lead${unassignedContactsCount === 1 ? " has" : "s have"} no owner.`,
      actionLabel: "View",
      href: "/contacts",
    },
    staleDeals.length > 0 && {
      key: "followup",
      title: "Follow up on stale deals",
      caption: `${staleDeals.length} open deal${staleDeals.length === 1 ? " hasn't" : "s haven't"} moved in 6+ days.`,
      actionLabel: "View",
      href: "/deals",
    },
    !business?.emailFromAddress && {
      key: "domain",
      title: "Connect your sending domain",
      caption: "Campaign emails still send from a shared test address.",
      actionLabel: "Fix",
      href: "/settings/channels",
    },
    resourcesCount === 0 && {
      key: "resources",
      title: "Add Business Resources",
      caption: "The AI Employee has no product/service knowledge yet.",
      actionLabel: "Add",
      href: "/resources",
    },
  ].filter((r): r is { key: string; title: string; caption: string; actionLabel: string; href: string } => !!r);

  return (
    <PageShell
      kicker="AI CRM Command Center"
      title="Dashboard"
      actions={
        <span
          className={cn(
            "inline-flex h-8 items-center gap-2 border px-3 text-xs font-bold tracking-wide uppercase",
            anyChannelConnected
              ? "border-[var(--status-good)]/30 bg-[var(--status-good)]/10 text-[var(--status-good)]"
              : "border-border bg-muted text-muted-foreground"
          )}
        >
          <span className="size-2 bg-current" />
          {anyChannelConnected ? "Automation Live" : "No channel connected"}
        </span>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="New Leads"
            value={leadCount}
            caption="vs last week"
            changeLabel={
              leadsThisWeek === 0 && leadsPrevWeek === 0
                ? "No change"
                : `${leadsTrendPct >= 0 ? "+" : ""}${leadsTrendPct}%`
            }
            tone={leadsTrendPct >= 0 ? "good" : "bad"}
            chart={<LeadTrendSparkline data={leadTrend} />}
          />
          <StatCard
            label="Active Conversations"
            value={activeConversations}
            caption="AI handling"
            changeLabel={String(aiHandling)}
            tone="good"
          />
          <StatCard
            label="Needs Human"
            value={escalatedConversations}
            caption="handoff queue"
            changeLabel={escalatedConversations > 0 ? "Urgent" : "Clear"}
            tone={escalatedConversations > 0 ? "warn" : "good"}
          />
          {isAdmin && (
            <StatCard
              label="Open Pipeline"
              value={`$${pipelineValue.toLocaleString()}`}
              caption={`${openDeals} active deal${openDeals === 1 ? "" : "s"}`}
              changeLabel={openDeals > 0 ? "Qualified" : "None yet"}
              tone="good"
            />
          )}
          <StatCard
            label="Overdue Tasks"
            value={tasksOverdue}
            caption={tasksOverdue > 0 ? "needs attention" : "all caught up"}
            changeLabel={tasksOverdue > 0 ? "Overdue" : "Clean"}
            tone={tasksOverdue > 0 ? "bad" : "good"}
          />
          <StatCard
            label="AI Response"
            value={avgFirstReplySeconds === null ? "—" : formatDuration(avgFirstReplySeconds)}
            caption="avg first reply"
            changeLabel={
              avgFirstReplySeconds === null
                ? "No data"
                : avgFirstReplySeconds < 60
                  ? "Fast"
                  : avgFirstReplySeconds < 300
                    ? "OK"
                    : "Slow"
            }
            tone={
              avgFirstReplySeconds === null || avgFirstReplySeconds >= 300
                ? "bad"
                : avgFirstReplySeconds < 60
                  ? "good"
                  : "warn"
            }
          />
        </div>

        <div className="mt-2">
          <h2 className="text-lg font-bold tracking-tight">Pipeline Operations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Deal movement, conversion pressure, and stage-level activity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_0.85fr]">
          <Card className="gap-0 overflow-hidden py-0">
            <PanelHeader
              title="Pipeline Board"
              subtitle={
                isAdmin
                  ? `$${pipelineValue.toLocaleString()} open pipeline across ${stages.length} stages`
                  : `${stages.length} stages`
              }
              badge={<span className={cn(BADGE_BASE, BADGE_BLUE)}>Live CRM</span>}
            />
            <div className="overflow-x-auto">
              <div className="flex divide-x">
                {stages.map((stage) => {
                  const total = stage.deals.reduce((sum, d) => sum + Number(d.value), 0);
                  const topDeal = stage.deals[0];
                  const widthPct =
                    stage.deals.length === 0
                      ? 5
                      : Math.max(8, Math.round((stage.deals.length / maxStageCount) * 100));
                  return (
                    <div key={stage.id} className="min-w-[150px] flex-1 space-y-1.5 px-4 py-4">
                      <p className="truncate text-xs font-semibold text-muted-foreground uppercase">
                        {stage.name}
                      </p>
                      <p className="text-xl font-bold tabular-nums">{stage.deals.length}</p>
                      {isAdmin && <p className="text-xs text-muted-foreground">${total.toLocaleString()}</p>}
                      <div className="h-[7px] bg-muted">
                        <div
                          className={cn("h-full", stageBarColor(stage.name))}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      {topDeal && (
                        <div className="mt-2 border border-border bg-muted/30 p-2">
                          <p className="truncate text-xs font-semibold">{topDeal.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {topDeal.contact.firstName} {topDeal.contact.lastName}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {isAdmin && (
              <div className="border-t px-5 py-4">
                <PipelineValueChart data={stageValueData} />
              </div>
            )}
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <PanelHeader
              title="Automation Health"
              subtitle="Bots, handoffs, and failed workflows"
              badge={
                <span className={cn(BADGE_BASE, escalatedConversations > 0 || failedConnectionsCount > 0 ? BADGE_WARN : BADGE_GOOD)}>
                  {escalatedConversations > 0 || failedConnectionsCount > 0 ? "Attention" : "Healthy"}
                </span>
              }
            />
            <div className="divide-y">
              {["WHATSAPP", "FACEBOOK", "INSTAGRAM"].map((channel) => {
                const conn = channelConnections.find((c) => c.channel === channel);
                const status = conn?.status ?? "DISCONNECTED";
                return (
                  <div key={channel} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{CHANNEL_LABELS[channel]} bot</p>
                      <p className="text-xs text-muted-foreground">
                        {status === "CONNECTED" ? "Connected and receiving messages" : "Not connected"}
                      </p>
                    </div>
                    <span className={cn(BADGE_BASE, connectionBadge[status])}>
                      {status === "CONNECTED" ? "Active" : status === "ERROR" ? "Error" : "Off"}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Human handoff</p>
                  <p className="text-xs text-muted-foreground">
                    {escalatedConversations} conversation{escalatedConversations === 1 ? "" : "s"} waiting for
                    an agent
                  </p>
                </div>
                <span className={cn(BADGE_BASE, escalatedConversations > 0 ? BADGE_WARN : BADGE_GOOD)}>
                  {escalatedConversations > 0 ? `${escalatedConversations} waiting` : "Clear"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Failed automations</p>
                  <p className="text-xs text-muted-foreground">
                    {failedConnectionsCount > 0
                      ? `${failedConnectionsCount} channel connection${failedConnectionsCount === 1 ? "" : "s"} in error`
                      : "No failed connections right now"}
                  </p>
                </div>
                <span className={cn(BADGE_BASE, failedConnectionsCount > 0 ? BADGE_CRITICAL : BADGE_GOOD)}>
                  {failedConnectionsCount > 0 ? `${failedConnectionsCount} Failed` : "0 Failed"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Lead capture</p>
                  <p className="text-xs text-muted-foreground">
                    {formsCount} form{formsCount === 1 ? "" : "s"} connected to CRM intake
                  </p>
                </div>
                <Link href="/forms" className={cn(BADGE_BASE, BADGE_BLUE, "hover:opacity-80")}>
                  View
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-2">
          <h2 className="text-lg font-bold tracking-tight">Action Queue</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Recommended next moves for sales and automation operators.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="gap-0 overflow-hidden py-0">
            <PanelHeader
              title="Needs Attention"
              subtitle="Escalated conversations"
              badge={
                escalatedList.length > 0 && (
                  <span className={cn(BADGE_BASE, BADGE_CRITICAL)}>{escalatedList.length}</span>
                )
              }
            />
            <div className="divide-y">
              {escalatedList.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/inbox/${conv.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {conv.contact.firstName} {conv.contact.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(conv.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <span className={cn(BADGE_BASE, BADGE_CRITICAL)}>Escalated</span>
                </Link>
              ))}
              {escalatedList.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nothing needs a human right now.</p>
              )}
            </div>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <PanelHeader
              title="Recent Deals"
              subtitle={isAdmin ? `$${pipelineValue.toLocaleString()} open` : undefined}
            />
            <div className="divide-y">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-3 px-4 py-3">
                  <EntityAvatar name={`${deal.contact.firstName} ${deal.contact.lastName}`} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{deal.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      BADGE_BASE,
                      stageBadgeClasses[deal.stageName.toLowerCase()]
                        ? cn("border-transparent", stageBadgeClasses[deal.stageName.toLowerCase()])
                        : BADGE_BLUE
                    )}
                  >
                    {deal.stageName}
                  </span>
                </div>
              ))}
              {unassignedDealsCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">No owner assigned</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {unassignedDealsCount} deal{unassignedDealsCount === 1 ? "" : "s"} need an owner
                    </p>
                  </div>
                  <Link href="/deals" className={cn(BADGE_BASE, BADGE_WARN, "hover:opacity-80")}>
                    Assign
                  </Link>
                </div>
              )}
              {recentDeals.length === 0 && unassignedDealsCount === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">No deals yet.</p>
              )}
            </div>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <PanelHeader
              title="AI Recommendations"
              subtitle="Real signals from your own CRM"
              badge={
                recommendations.length > 0 && (
                  <span className={cn(BADGE_BASE, BADGE_GOOD)}>{recommendations.length} ready</span>
                )
              }
            />
            <div className="divide-y">
              {recommendations.map((rec) => (
                <div key={rec.key} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{rec.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{rec.caption}</p>
                  </div>
                  <Link
                    href={rec.href}
                    className="inline-flex h-7 shrink-0 items-center border border-input px-2.5 text-xs font-semibold hover:border-foreground"
                  >
                    {rec.actionLabel}
                  </Link>
                </div>
              ))}
              {recommendations.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Nothing to flag right now — your setup looks healthy.
                </p>
              )}
            </div>
          </Card>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader title="Recent Activity" subtitle="Latest events across your CRM" />
          <RecentActivity events={recentActivity} />
        </Card>
      </div>
    </PageShell>
  );
}
