import { getResources } from "@/lib/actions/resources";
import { NewResourceDialog } from "@/components/new-resource-dialog";
import { ImportWebsiteDialog } from "@/components/import-website-dialog";
import { DeleteResourceButton } from "@/components/delete-resource-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business Resources</h1>
          <p className="text-sm text-muted-foreground">
            The knowledge base the AI Employee uses to answer customers.
          </p>
        </div>
        <div className="flex gap-2">
          <ImportWebsiteDialog />
          <NewResourceDialog />
        </div>
      </div>

      <div className="space-y-3">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{resource.title}</p>
                    <Badge variant="secondary">{resource.category.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {resource.content}
                  </p>
                </div>
                <DeleteResourceButton id={resource.id} />
              </div>
            </CardContent>
          </Card>
        ))}
        {resources.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No resources yet. Add products, services, FAQs, or policies for the AI Employee to use.
          </p>
        )}
      </div>
    </div>
  );
}
