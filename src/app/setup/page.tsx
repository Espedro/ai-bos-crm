import { headers } from "next/headers";
import { requireAdminPage } from "@/lib/current-agent";
import { completeSetup } from "@/lib/actions/business";
import { getResources } from "@/lib/actions/resources";
import { getChannelConnections } from "@/lib/actions/channels";
import { NewResourceDialog } from "@/components/new-resource-dialog";
import { ImportWebsiteDialog } from "@/components/import-website-dialog";
import { WhatsAppConnectionCard } from "@/components/whatsapp-connection-card";
import { MetaMessagingConnectionCard } from "@/components/meta-messaging-connection-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

function StepBadge({ done }: { done: boolean }) {
  return done ? (
    <Badge className="gap-1">
      <CheckCircle2 className="size-3.5" /> Done
    </Badge>
  ) : (
    <Badge variant="secondary">Not started</Badge>
  );
}

export default async function SetupPage() {
  await requireAdminPage();
  const [resources, connections, hdrs] = await Promise.all([
    getResources(),
    getChannelConnections(),
    headers(),
  ]);
  const [whatsapp, facebook, instagram] = connections;

  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-12">
      <div>
        <p className="text-sm font-semibold text-primary">Welcome to AI BOS CRM</p>
        <h1 className="text-[28px] font-bold tracking-tight">Let&apos;s finish setting up</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A couple of optional steps and your AI Employee will be ready to talk to customers.
        </p>
      </div>

      {/* Step 1 — Business knowledge */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>1. Business Knowledge (optional)</CardTitle>
          <StepBadge done={resources.length > 0} />
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            FAQs, pricing, and policies your AI Employee will use to answer customers. You
            can always add more later from Resources.
          </p>
          {resources.length > 0 && (
            <ul className="space-y-1">
              {resources.map((r) => (
                <li key={r.id} className="text-sm font-medium">
                  {r.title}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <ImportWebsiteDialog />
            <NewResourceDialog />
          </div>
        </CardContent>
      </Card>

      {/* Step 2 — Connect channels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>2. Connect Channels (optional)</CardTitle>
          <StepBadge done={connections.some((c) => c.status === "CONNECTED")} />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Connect WhatsApp, Facebook, or Instagram now, or skip and do this later from
              Settings.
            </p>
            <div className="grid gap-6 lg:grid-cols-3">
              <WhatsAppConnectionCard
                connection={whatsapp}
                webhookUrl={`${origin}/api/webhooks/whatsapp/${whatsapp.id}`}
              />
              <MetaMessagingConnectionCard
                channel="FACEBOOK"
                title="Facebook Messenger"
                pageIdLabel="Facebook Page ID"
                description="Connect your own Facebook Page and Meta App with the Messenger product enabled."
                connection={facebook}
                webhookUrl={`${origin}/api/webhooks/messenger/${facebook.id}`}
                connectHref="/api/auth/facebook/connect"
              />
              <MetaMessagingConnectionCard
                channel="INSTAGRAM"
                title="Instagram DM"
                pageIdLabel="Instagram Business Account ID"
                description="Requires an Instagram Business account connected to a Facebook Page."
                connection={instagram}
                webhookUrl={`${origin}/api/webhooks/instagram/${instagram.id}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <form action={completeSetup} className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          You can always add more resources or connect additional channels later from
          Settings.
        </p>
        <Button type="submit" size="lg">
          Finish Setup
        </Button>
      </form>
    </div>
  );
}
