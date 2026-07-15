import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getForm } from "@/lib/actions/forms";
import { getCurrentAgent } from "@/lib/current-agent";
import { CopyableField } from "@/components/copyable-field";
import { DeleteFormButton } from "@/components/delete-form-button";
import { FormCoverImageEditor } from "@/components/form-cover-image-editor";
import { PanelHeader } from "@/components/panel-header";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [form, hdrs, agent] = await Promise.all([getForm(id), headers(), getCurrentAgent()]);
  if (!form) notFound();
  const isAdmin = agent.role === "ADMIN";

  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/form/${form.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{form.name}</h1>
            <span className="inline-flex bg-[var(--status-good)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--status-good)] uppercase">
              Live
            </span>
          </div>
          {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
        </div>
        {isAdmin && <DeleteFormButton id={form.id} redirectTo="/forms" />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader title="Cover Image" />
          <div className="p-4">
            <FormCoverImageEditor formId={form.id} initialUrl={form.coverImageUrl} />
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <PanelHeader title="Share This Form" subtitle="Public link, no login required" />
          <div className="p-4">
            <CopyableField label="Public link" value={shareUrl} />
          </div>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <PanelHeader
          title="Submissions"
          subtitle={`${form.submissions.length} total`}
          badge={
            form.submissions.length > 0 && (
              <span className="bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary uppercase">
                {form.submissions.length}
              </span>
            )
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Contact
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Message
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Details
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {form.submissions.map((submission) => {
                const data = JSON.parse(submission.data) as Record<string, string>;
                const { firstName, lastName, email, phone, message, ...extra } = data;
                const extraEntries = Object.entries(extra).filter(([, v]) => v);
                return (
                  <tr key={submission.id} className="border-b align-top hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold">
                        {firstName} {lastName}
                      </p>
                      {submission.contact && (
                        <span className="mt-1 inline-flex bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                          Contact created
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <p>{email || "—"}</p>
                      {phone && <p>{phone}</p>}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-sm text-muted-foreground">
                      {message || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {extraEntries.length > 0 ? (
                        <dl className="space-y-0.5">
                          {extraEntries.map(([key, value]) => (
                            <div key={key}>
                              <dt className="inline font-semibold">{key}: </dt>
                              <dd className="inline">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
                      {formatDistanceToNow(submission.createdAt, { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {form.submissions.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted-foreground">No submissions yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
