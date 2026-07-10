import { prisma } from "@/lib/prisma";
import { getDealsByStage } from "@/lib/actions/deals";
import { getLeadTrend } from "@/lib/actions/dashboard";
import { getRecentActivity } from "@/lib/activity";
import { Card, CardContent } from "@/components/ui/card";
import { EntityAvatar } from "@/components/entity-avatar";
import { cn } from "@/lib/utils";
import { stageDotColor } from "@/lib/stage-colors";
import { PipelineValueChart } from "@/components/dashboard/pipeline-value-chart";
import { LeadTrendSparkline } from "@/components/dashboard/lead-trend-sparkline";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  UserPlus,
  Handshake,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

function weekOverWeek(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  alert = false,
  chart,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend: { direction: "up" | "down"; pct: number; caption: string } | { caption: string };
  alert?: boolean;
  chart?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              alert
                ? "bg-[var(--status-critical)]/12 text-[var(--status-critical)]"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="size-4.5" />
          </div>
        </div>
        <p className="mt-2 text-[28px] font-bold tracking-tight tabular-nums">{value}</p>
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          {"direction" in trend && (
            <>
              {trend.direction === "up" ? (
                <TrendingUp className="size-4 text-[var(--status-good)]" />
              ) : (
                <TrendingDown className="size-4 text-[var(--status-critical)]" />
              )}
              <span
                className={
                  trend.direction === "up"
                    ? "text-[var(--status-good)]"
                    : "text-[var(--status-critical)]"
                }
              >
                {Math.abs(trend.pct)}%
              </span>
            </>
          )}
          <span className="text-muted-foreground">{trend.caption}</span>
        </div>
        {chart && <div className="-mx-1 mt-1">{chart}</div>}
      </CardContent>
    </Card>
  );
}

const stageBadgeClasses: Record<string, string> = {
  won: "bg-[var(--status-good)] text-white",
  lost: "bg-[var(--status-critical)] text-white",
};

export default async function DashboardPage() {
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
  ] = await Promise.all([
    prisma.contact.count({ where: { status: "LEAD" } }),
    getDealsByStage(),
    prisma.task.count({ where: { completed: false, dueDate: { lt: startOfToday } } }),
    prisma.conversation.count({ where: { status: { not: "CLOSED" } } }),
    prisma.conversation.count({ where: { status: "ESCALATED" } }),
    prisma.contact.count({ where: { status: "LEAD", createdAt: { gte: sevenDaysAgo } } }),
    prisma.contact.count({
      where: { status: "LEAD", createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.deal.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.deal.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    getLeadTrend(14),
    getRecentActivity(8),
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

  return (
    <div className="space-y-6">
      <h1 className="text-[32px] font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New Leads"
          value={leadCount}
          icon={UserPlus}
          trend={
            leadsThisWeek === 0 && leadsPrevWeek === 0
              ? { caption: "No new leads this week" }
              : {
                  direction: leadsTrendPct >= 0 ? "up" : "down",
                  pct: leadsTrendPct,
                  caption: "vs last week",
                }
          }
          chart={<LeadTrendSparkline data={leadTrend} />}
        />
        <StatCard
          label="Open Deals"
          value={openDeals}
          icon={Handshake}
          trend={
            dealsThisWeek === 0 && dealsPrevWeek === 0
              ? { caption: "No new deals this week" }
              : {
                  direction: dealsTrendPct >= 0 ? "up" : "down",
                  pct: dealsTrendPct,
                  caption: "new vs last week",
                }
          }
        />
        <StatCard
          label="Active Conversations"
          value={activeConversations}
          icon={MessageCircle}
          alert={escalatedConversations > 0}
          trend={{
            caption:
              escalatedConversations > 0
                ? `${escalatedConversations} need a human`
                : "All handled by AI",
          }}
        />
        <StatCard
          label="Overdue Tasks"
          value={tasksOverdue}
          icon={AlertTriangle}
          alert={tasksOverdue > 0}
          trend={{ caption: tasksOverdue > 0 ? "Needs attention" : "All caught up" }}
        />
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Pipeline Overview</h2>
          <p className="text-sm text-muted-foreground">
            ${pipelineValue.toLocaleString()} open pipeline
          </p>
        </div>
        <Card className="py-0">
          <div className="overflow-x-auto">
            <div className="flex divide-x">
              {stages.map((stage, index) => {
                const total = stage.deals.reduce((sum, d) => sum + Number(d.value), 0);
                return (
                  <div key={stage.id} className="min-w-[140px] flex-1 space-y-1.5 px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", stageDotColor(stage.name, index))} />
                      <p className="truncate text-xs font-semibold text-muted-foreground">
                        {stage.name}
                      </p>
                    </div>
                    <p className="text-xl font-bold tabular-nums">{stage.deals.length}</p>
                    {total > 0 && (
                      <p className="text-xs text-muted-foreground">${total.toLocaleString()}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t px-5 py-4">
            <PipelineValueChart data={stageValueData} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-bold">Recent Deals</h2>
          <Card className="py-0">
            <div className="divide-y">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-4 px-5 py-4">
                  <EntityAvatar
                    name={`${deal.contact.firstName} ${deal.contact.lastName}`}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{deal.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </p>
                  </div>
                  <p className="hidden shrink-0 text-sm font-semibold tabular-nums sm:block">
                    ${Number(deal.value).toLocaleString()}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                      stageBadgeClasses[deal.stageName.toLowerCase()] ?? "bg-primary text-primary-foreground"
                    )}
                  >
                    {deal.stageName}
                  </span>
                </div>
              ))}
              {recentDeals.length === 0 && (
                <p className="px-5 py-6 text-sm text-muted-foreground">No deals yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold">Recent Activity</h2>
          <Card className="py-0">
            <RecentActivity events={recentActivity} />
          </Card>
        </div>
      </div>
    </div>
  );
}
