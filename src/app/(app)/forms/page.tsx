import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAgent } from "@/lib/current-agent";
import { getForms } from "@/lib/actions/forms";
import { NewFormDialog } from "@/components/new-form-dialog";
import { PanelHeader } from "@/components/panel-header";
import { PageShell } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const BADGE_BASE =
  "inline-flex h-6 items-center gap-1 border px-2 text-[11px] font-extrabold tracking-wide whitespace-nowrap uppercase";
const BADGE_GOOD = "border-[var(--status-good)]/35 bg-[var(--status-good)]/10 text-[var(--status-good)]";

const TONE_CLASSES: Record<"good" | "warn", string> = {
  good: "text-[var(--status-good)]",
  warn: "text-[var(--status-serious)]",
};

function StatTile({
  label,
  value,
  caption,
  changeLabel,
  tone,
}: {
  label: string;
  value: number | string;
  caption: string;
  changeLabel: string;
  tone: "good" | "warn";
}) {
  return (
    <Card className="min-h-[100px] justify-between gap-0 py-4">
      <div className="px-4">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 px-4 text-xs">
        <span className="text-muted-foreground">{caption}</span>
        <span className={cn("font-extrabold uppercase", TONE_CLASSES[tone])}>{changeLabel}</span>
      </div>
    </Card>
  );
}

export default async function FormsPage() {
  const agent = await getCurrentAgent();
  const businessId = agent.businessId;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    forms,
    uniqueLeadRows,
    submissionsThisWeek,
    submissionsLast30Days,
    resourcesCount,
    campaignsCount,
    unassignedFormLeadsCount,
  ] = await Promise.all([
    getForms(),
    prisma.formSubmission.findMany({
      where: { form: { businessId } },
      select: { contactId: true },
      distinct: ["contactId"],
    }),
    prisma.formSubmission.count({
      where: { form: { businessId }, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.formSubmission.count({
      where: { form: { businessId }, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.businessResource.count({ where: { businessId } }),
    prisma.campaign.count({ where: { businessId } }),
    prisma.contact.count({
      where: { businessId, assignedAgentId: null, formSubmissions: { some: {} } },
    }),
  ]);

  const formsWithTag = forms.filter((f) => f.tagOnSubmit);
  const formWithoutCover = forms.find((f) => !f.coverImageUrl);

  const recommendations = [
    formWithoutCover && {
      key: "cover",
      title: "Add a cover image",
      caption: `"${formWithoutCover.name}" has no header image yet.`,
      actionLabel: "Add",
      href: `/forms/${formWithoutCover.id}`,
    },
    unassignedFormLeadsCount > 0 && {
      key: "assign",
      title: "Assign form leads",
      caption: `${unassignedFormLeadsCount} contact${unassignedFormLeadsCount === 1 ? "" : "s"} from forms have no owner.`,
      actionLabel: "View",
      href: "/contacts",
    },
    resourcesCount === 0 && {
      key: "resources",
      title: "Add Business Resources",
      caption: "The AI Employee has no product/service knowledge yet.",
      actionLabel: "Add",
      href: "/resources",
    },
    forms.length > 0 &&
      campaignsCount === 0 && {
        key: "campaign",
        title: "Start a follow-up campaign",
        caption: "No email campaign has been sent to form leads yet.",
        actionLabel: "Create",
        href: "/campaigns/new",
      },
  ].filter((r): r is { key: string; title: string; caption: string; actionLabel: string; href: string } => !!r);

  return (
    <PageShell kicker="Lead Capture Hub" title="Forms">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Lead Capture Hub</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Public forms connected to CRM intake and automatic lead capture.
            </p>
          </div>
          <NewFormDialog />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile
            label="Total Forms"
            value={forms.length}
            caption="live and collecting"
            changeLabel={forms.length > 0 ? "Active" : "None yet"}
            tone={forms.length > 0 ? "good" : "warn"}
          />
          <StatTile
            label="Submissions"
            value={submissionsLast30Days}
            caption="last 30 days"
            changeLabel={submissionsLast30Days > 0 ? "Active" : "Setup"}
            tone={submissionsLast30Days > 0 ? "good" : "warn"}
          />
          <StatTile
            label="Unique Leads"
            value={uniqueLeadRows.length}
            caption="distinct contacts"
            changeLabel="Ready"
            tone="good"
          />
          <StatTile
            label="Auto-Tagging"
            value={formsWithTag.length}
            caption="tag on submit"
            changeLabel={formsWithTag.length > 0 ? "Connected" : "Setup"}
            tone={formsWithTag.length > 0 ? "good" : "warn"}
          />
          <StatTile
            label="This Week"
            value={submissionsThisWeek}
            caption="submissions in last 7 days"
            changeLabel={submissionsThisWeek > 0 ? "Active" : "Quiet"}
            tone={submissionsThisWeek > 0 ? "good" : "warn"}
          />
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader title="Forms" subtitle={`${forms.length} form${forms.length === 1 ? "" : "s"}`} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Form Name", "Status", "Submissions", "Connected Automation", "Last Submission", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold">{form.name}</p>
                      {form.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{form.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(BADGE_BASE, BADGE_GOOD)}>Live</span>
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">{form._count.submissions}</td>
                    <td className="px-4 py-3">
                      {form.tagOnSubmit ? (
                        <span className={cn(BADGE_BASE, BADGE_GOOD)}>Tag: {form.tagOnSubmit}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {form.submissions[0]
                        ? formatDistanceToNow(form.submissions[0].createdAt, { addSuffix: true })
                        : "No submissions yet"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={`/form/${form.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 items-center border border-input px-2.5 text-xs font-semibold hover:border-foreground"
                        >
                          Preview
                        </a>
                        <Link
                          href={`/forms/${form.id}`}
                          className="inline-flex h-7 items-center border border-input px-2.5 text-xs font-semibold hover:border-foreground"
                        >
                          Share
                        </Link>
                        <Link
                          href={`/forms/${form.id}`}
                          className="inline-flex h-7 items-center border border-input px-2.5 text-xs font-semibold hover:border-foreground"
                        >
                          Leads
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {forms.length === 0 && (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                No forms yet. Create one to start collecting leads.
              </p>
            )}
          </div>
        </Card>

        {recommendations.length > 0 && (
          <>
            <div className="mt-2">
              <h2 className="text-lg font-bold tracking-tight">Setup Recommendations</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Real gaps found in your own forms and CRM setup.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((rec) => (
                <Card key={rec.key} className="gap-2 p-4 shadow-none">
                  <h3 className="text-sm font-semibold">{rec.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{rec.caption}</p>
                  <Link
                    href={rec.href}
                    className="mt-2 inline-flex h-8 w-fit items-center bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {rec.actionLabel}
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
