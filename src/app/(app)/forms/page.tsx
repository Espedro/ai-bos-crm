import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAgent } from "@/lib/current-agent";
import { getForms } from "@/lib/actions/forms";
import { NewFormDialog } from "@/components/new-form-dialog";
import { PanelHeader } from "@/components/panel-header";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

function StatTile({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <Card className="min-h-[100px] justify-between gap-0 py-4">
      <div className="px-4">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      </div>
      <p className="mt-2 px-4 text-xs text-muted-foreground">{caption}</p>
    </Card>
  );
}

export default async function FormsPage() {
  const agent = await getCurrentAgent();
  const businessId = agent.businessId;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [forms, uniqueLeadRows, submissionsThisWeek] = await Promise.all([
    getForms(),
    prisma.formSubmission.findMany({
      where: { form: { businessId } },
      select: { contactId: true },
      distinct: ["contactId"],
    }),
    prisma.formSubmission.count({
      where: { form: { businessId }, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const totalSubmissions = forms.reduce((sum, f) => sum + f._count.submissions, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Lead Capture Hub</h1>
          <p className="text-sm text-muted-foreground">
            Public forms connected to CRM intake — every submission becomes a Contact automatically.
          </p>
        </div>
        <NewFormDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Forms" value={forms.length} caption="live and collecting" />
        <StatTile label="Submissions" value={totalSubmissions} caption="all time" />
        <StatTile label="Unique Leads" value={uniqueLeadRows.length} caption="distinct contacts captured" />
        <StatTile label="This Week" value={submissionsThisWeek} caption="submissions in last 7 days" />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <PanelHeader title="Forms" subtitle={`${forms.length} form${forms.length === 1 ? "" : "s"}`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Form Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Submissions
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Tag on Submit
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Last Submission
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Actions
                </th>
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
                    <span className="inline-flex bg-[var(--status-good)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--status-good)] uppercase">
                      Live
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">{form._count.submissions}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{form.tagOnSubmit ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {form.submissions[0]
                      ? formatDistanceToNow(form.submissions[0].createdAt, { addSuffix: true })
                      : "No submissions yet"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/forms/${form.id}`}
                      className="inline-flex h-7 items-center border border-input px-2.5 text-xs font-semibold hover:border-foreground"
                    >
                      Open
                    </Link>
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
    </div>
  );
}
