import { notFound } from "next/navigation";
import { getCampaign, countMatchingContacts } from "@/lib/actions/campaigns";
import { CampaignActions } from "@/components/campaign-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const recipientCount =
    campaign.status === "DRAFT"
      ? await countMatchingContacts(campaign.filterTag, campaign.filterStatus)
      : campaign.recipients.length;

  const sent = campaign.recipients.filter((r) => r.status === "SENT").length;
  const failed = campaign.recipients.filter((r) => r.status === "FAILED").length;
  const opened = campaign.recipients.filter((r) => r.openedAt).length;
  const clicked = campaign.recipients.filter((r) => r.clickedAt).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <Badge variant="secondary">{campaign.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignActions
            campaignId={campaign.id}
            status={campaign.status}
            recipientCount={recipientCount}
          />
          {campaign.scheduledAt && (
            <p className="mt-2 text-sm text-muted-foreground">
              Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {campaign.recipients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{sent}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{opened}</p>
              <p className="text-xs text-muted-foreground">Opened</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{clicked}</p>
              <p className="text-xs text-muted-foreground">Clicked</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border p-4 text-sm"
            dangerouslySetInnerHTML={{ __html: campaign.body }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
