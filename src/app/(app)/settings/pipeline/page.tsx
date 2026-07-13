import { requireAdminPage } from "@/lib/current-agent";
import { getStagesWithDealCounts } from "@/lib/actions/deals";
import { SettingsNav } from "@/components/settings-nav";
import { StageManager } from "@/components/stage-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PipelineSettingsPage() {
  await requireAdminPage();
  const stages = await getStagesWithDealCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>
      <SettingsNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deal Pipeline Stages</CardTitle>
          <p className="text-sm text-muted-foreground">
            These are the columns on your Deals board. Reorder, rename, or add stages — a stage
            with deals in it must be emptied before it can be removed.
          </p>
        </CardHeader>
        <CardContent>
          <StageManager stages={stages} />
        </CardContent>
      </Card>
    </div>
  );
}
