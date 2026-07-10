import Link from "next/link";
import { getCampaigns } from "@/lib/actions/campaigns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  DRAFT: "secondary",
  SCHEDULED: "default",
  SENDING: "default",
  SENT: "default",
  FAILED: "destructive",
};

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Mass email your Contacts — compose, send, and track opens/clicks.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>New Campaign</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{campaign._count.recipients} recipients</Badge>
                  <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No campaigns yet. Create one to start emailing your Contacts.
          </p>
        )}
      </div>
    </div>
  );
}
