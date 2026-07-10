import Link from "next/link";
import { getForms } from "@/lib/actions/forms";
import { NewFormDialog } from "@/components/new-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FormsPage() {
  const forms = await getForms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="text-sm text-muted-foreground">
            Public lead-capture forms you can share — submissions become Contacts automatically.
          </p>
        </div>
        <NewFormDialog />
      </div>

      <div className="space-y-3">
        {forms.map((form) => (
          <Link key={form.id} href={`/forms/${form.id}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">{form.name}</p>
                  {form.description && (
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                  )}
                </div>
                <Badge variant="secondary">{form._count.submissions} submissions</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
        {forms.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No forms yet. Create one to start collecting leads.
          </p>
        )}
      </div>
    </div>
  );
}
