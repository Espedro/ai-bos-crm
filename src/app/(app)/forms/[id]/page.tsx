import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getForm } from "@/lib/actions/forms";
import { CopyableField } from "@/components/copyable-field";
import { DeleteFormButton } from "@/components/delete-form-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [form, hdrs] = await Promise.all([getForm(id), headers()]);
  if (!form) notFound();

  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/form/${form.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{form.name}</h1>
          {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          )}
        </div>
        <DeleteFormButton id={form.id} redirectTo="/forms" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share this form</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyableField label="Public link" value={shareUrl} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Submissions ({form.submissions.length})
        </h2>
        <div className="space-y-3">
          {form.submissions.map((submission) => {
            const data = JSON.parse(submission.data) as Record<string, string>;
            const { firstName, lastName, email, phone, message, ...extra } = data;
            const extraEntries = Object.entries(extra).filter(([, v]) => v);
            return (
              <Card key={submission.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {firstName} {lastName}
                    </p>
                    {submission.contact && <Badge variant="secondary">Contact created</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
                  {message && <p className="mt-2 text-sm">{message}</p>}
                  {extraEntries.length > 0 && (
                    <dl className="mt-2 space-y-1 border-t pt-2">
                      {extraEntries.map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <dt className="inline font-medium text-muted-foreground">{key}: </dt>
                          <dd className="inline">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {form.submissions.length === 0 && (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
