import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDealsByStage } from "@/lib/actions/deals";
import { getLeadTrend } from "@/lib/actions/dashboard";
import { getRecentActivity } from "@/lib/activity";
import { getCurrentAgent } from "@/lib/current-agent";
import { Card } from "@/components/ui/card";
import { EntityAvatar } from "@/components/entity-avatar";
import { PanelHeader } from "@/components/panel-header";
import { cn } from "@/lib/utils";
import { stageDotColor } from "@/lib/stage-colors";
import { PipelineValueChart } from "@/components/dashboard/pipeline-value-chart";
import { LeadTrendSparkline } from "@/components/dashboard/lead-trend-sparkline";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";

function weekOverWeek(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function StatCard({
  label,
  value,
  trend,
  alert = false,
  chart,
}: {
  label: string;
  value: number | string;
  trend: { direction: "up" | "down"; pct: number; caption: string } | { caption: string };
  alert?: boolean;
  chart?: React.ReactNode;
}) {
  return (
    <Card className="min-h-[124px] justify-between gap-0 py-4">
      <div className="px-4">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p
          className={cn(
            "mt-2.5 text-[28px] font-bold tracking-tight tabular-nums",
            alert && "text-[var(--status-critical)]"
          )}
        >
          {value}
        </p>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 px-4 text-xs">
        {"direction" in trend && (
          <>
            {trend.direction === "up" ? (
              <TrendingUp className="size-3.5 text-[var(--status-good)]" />
            ) : (
              <TrendingDown className="size-3.5 text-[var(--status-critical)]" />
            )}
            <span
              className={cn(
                "font-bold",
                trend.direction === "up" ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"
              )}
            >
              {Math.abs(trend.pct)}%
            </span>
          </>
        )}
        <span className="text-muted-foreground">{trend.caption}</span>
      </div>
      {chart && <div className="-mb-1 px-1">{chart}</div>}
    </Card>
  );
}

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
  CONNECTED: "bg-[var(--status-good)]/15 text-[var(--status-good)]",
  ERROR: "bg-[var(--status-critical)]/15 text-[var(--status-critical)]",
  DISCONNECTED: "bg-muted text-muted-foreground",
};

export default async function DashboardPage() {
  const agent = await getCurrentAgent();
  const isAdmin = agent.role === "ADMIN";
  const businessId = agent.businessId;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    leadCount,
    stages,
    tasksOverdue,
    activeConversations,
    escalatedConversations,
    leadsThisWeek,
    leadsPrevWeek,
    dealsThisWeek,
    dealsPrevWeek,
    leadTrend,
    recentActivity,
    channelConnections,
    escalatedList,
    unassignedDeals,
    unassignedDealsCount,
    formsCount,
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
    prisma.deal.count({ where: { businessId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.deal.count({
      where: { businessId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    getLeadTrend(14),
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
    prisma.deal.findMany({
      where: { businessId, assignedAgentId: null },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.deal.count({ where: { businessId, assignedAgentId: null } }),
    prisma.form.count({ where: { businessId } }),
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

  const leadsTrendPct = weekOverWeek(leadsThisWeek, leadsPrevWeek);
  const dealsTrendPct = weekOverWeek(dealsThisWeek, dealsPrevWeek);

  const recentDeals = stages
    .flatMap((s) => s.deals.map((d) => ({ ...d, stageName: s.name })))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const aiHandling = activeConversations - escalatedConversations;
  const anyChannelConnected = channelConnections.some((c) => c.status === "CONNECTED");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold tracking-tight">Dashboard</h1>
        <span
          className={cn(
            "inline-flex h-8 items-center gap-2 border px-3 text-xs font-bold tracking-wide uppercase",
            anyChannelConnected
              ? "border-[var(--status-good)]/30 bg-[var(--status-good)]/10 text-[var(--status-good)]"
              : "border-border bg-muted text-muted-foreground"
          )}
        >
          <span className="size-2 rounded-full bg-current" />
          {anyChannelConnected ? "Automation Live" : "No channel connected"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="New Leads"
          value={leadCount}
          trend={
            leadsThisWeek === 0 && leadsPrevWeek === 0
              ? { caption: "No new leads this week" }
              : { direction: leadsTrendPct >= 0 ? "up" : "down", pct: leadsTrendPct, caption: "vs last week" }
          }
          chart={<LeadTrendSparkline data={leadTrend} />}
        />
        <StatCard
          label="Open Deals"
          value={openDeals}
          trend={
            dealsThisWeek === 0 && dealsPrevWeek === 0
              ? { caption: "No new deals this week" }
              : { direction: dealsTrendPct >= 0 ? "up" : "down", pct: dealsTrendPct, caption: "new vs last week" }
          }
        />
        {isAdmin && (
          <StatCard
            label="Open Pipeline"
            value={`$${pipelineValue.toLocaleString()}`}
            trend={{ caption: `${openDeals} active deal${openDeals === 1 ? "" : "s"}` }}
          />
        )}
        <StatCard
          label="Active Conversations"
          value={activeConversations}
          alert={escalatedConversations > 0}
          trend={{
            caption: escalatedConversations > 0 ? `${escalatedConversations} need a human` : "All handled by AI",
          }}
        />
        <StatCard
          label="Needs Human"
          value={escalatedConversations}
          alert={escalatedConversations > 0}
          trend={{ caption: escalatedConversations > 0 ? "handoff queue" : "queue is clear" }}
        />
        <StatCard
          label="Overdue Tasks"
          value={tasksOverdue}
          alert={tasksOverdue > 0}
          trend={{ caption: tasksOverdue > 0 ? "Needs attention" : "All caught up" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_0.85fr]">
        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader
            title="Pipeline Board"
            subtitle={isAdmin ? `$${pipelineValue.toLocaleString()} open pipeline across ${stages.length} stages` : `${stages.length} stages`}
            badge={
              <Link
                href="/deals"
                className="inline-flex h-7 items-center border border-input px-2.5 text-xs font-semibold hover:border-foreground"
              >
                Open Deals
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <div className="flex divide-x">
              {stages.map((stage, index) => {
                const total = stage.deals.reduce((sum, d) => sum + Number(d.value), 0);
                const topDeal = stage.deals[0];
                return (
                  <div key={stage.id} className="min-w-[150px] flex-1 space-y-1.5 px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", stageDotColor(stage.name, index))} />
                      <p className="truncate text-xs font-semibold text-muted-foreground uppercase">
                        {stage.name}
                      </p>
                    </div>
                    <p className="text-xl font-bold tabular-nums">{stage.deals.length}</p>
                    {isAdmin && total > 0 && (
                      <p className="text-xs text-muted-foreground">${total.toLocaleString()}</p>
                    )}
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
            subtitle="Channels, handoffs, and lead capture"
            badge={
              <span className="border border-[var(--status-good)]/30 bg-[var(--status-good)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--status-good)] uppercase">
                {escalatedConversations > 0 ? "Attention" : "Healthy"}
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
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 text-[11px] font-bold uppercase",
                      connectionBadge[status]
                    )}
                  >
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
              <span
                className={cn(
                  "shrink-0 px-2 py-0.5 text-[11px] font-bold uppercase",
                  escalatedConversations > 0
                    ? "bg-[var(--status-warning)]/20 text-[var(--status-serious)]"
                    : "bg-[var(--status-good)]/15 text-[var(--status-good)]"
                )}
              >
                {escalatedConversations > 0 ? `${escalatedConversations} waiting` : "Clear"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">AI handling</p>
                <p className="text-xs text-muted-foreground">
                  {aiHandling} conversation{aiHandling === 1 ? "" : "s"} under AI control
                </p>
              </div>
              <span className="shrink-0 bg-[var(--status-good)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--status-good)] uppercase">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Lead capture</p>
                <p className="text-xs text-muted-foreground">
                  {formsCount} form{formsCount === 1 ? "" : "s"} connected to CRM intake
                </p>
              </div>
              <Link
                href="/forms"
                className="shrink-0 border border-input px-2 py-0.5 text-[11px] font-bold uppercase hover:border-foreground"
              >
                View
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader
            title="Needs Attention"
            subtitle="Escalated conversations"
            badge={
              escalatedList.length > 0 && (
                <span className="bg-[var(--status-critical)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--status-critical)] uppercase">
                  {escalatedList.length}
                </span>
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
                <span className="shrink-0 bg-[var(--status-critical)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--status-critical)] uppercase">
                  Escalated
                </span>
              </Link>
            ))}
            {escalatedList.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground">Nothing needs a human right now.</p>
            )}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader title="Recent Deals" subtitle={isAdmin ? `$${pipelineValue.toLocaleString()} open` : undefined} />
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
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                    stageBadgeClasses[deal.stageName.toLowerCase()] ?? "bg-primary text-primary-foreground"
                  )}
                >
                  {deal.stageName}
                </span>
              </div>
            ))}
            {recentDeals.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground">No deals yet.</p>
            )}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader
            title="Unassigned"
            subtitle="Deals with no owner"
            badge={
              unassignedDealsCount > 0 && (
                <span className="bg-[var(--status-warning)]/20 px-2 py-0.5 text-[11px] font-bold text-[var(--status-serious)] uppercase">
                  {unassignedDealsCount}
                </span>
              )
            }
          />
          <div className="divide-y">
            {unassignedDeals.map((deal) => (
              <div key={deal.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{deal.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </p>
                </div>
                <Link
                  href="/deals"
                  className="shrink-0 border border-input px-2 py-0.5 text-[11px] font-bold uppercase hover:border-foreground"
                >
                  Assign
                </Link>
              </div>
            ))}
            {unassignedDeals.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground">Every deal has an owner.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <PanelHeader title="Recent Activity" subtitle="Latest events across your CRM" />
        <RecentActivity events={recentActivity} />
      </Card>
    </div>
  );
}
