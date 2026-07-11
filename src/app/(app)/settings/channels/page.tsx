import { headers } from "next/headers";
import { getChannelConnections } from "@/lib/actions/channels";
import { updateEmailSettings } from "@/lib/actions/business";
import { getTikTokConnection } from "@/lib/actions/tiktok";
import { WhatsAppConnectionCard } from "@/components/whatsapp-connection-card";
import { MetaMessagingConnectionCard } from "@/components/meta-messaging-connection-card";
import { TikTokAdsConnectionCard } from "@/components/tiktok-ads-connection-card";
import { SettingsNav } from "@/components/settings-nav";
import { requireAdminPage, getCurrentBusiness } from "@/lib/current-agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function ChannelsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ fb_connected?: string; fb_error?: string; tiktok_error?: string }>;
}) {
  await requireAdminPage();

  const [connections, hdrs, params, business, tiktok] = await Promise.all([
    getChannelConnections(),
    headers(),
    searchParams,
    getCurrentBusiness(),
    getTikTokConnection(),
  ]);
  const [whatsapp, facebook, instagram] = connections;

  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>
      <SettingsNav />
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Channel Connections</h2>
        <p className="text-sm text-muted-foreground">
          Connect your own WhatsApp Business, Facebook Page, and Instagram accounts so
          the AI Employee can answer real customer messages.
        </p>
      </div>

      {params.fb_connected && (
        <div className="rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm text-green-700 dark:text-green-400">
          Connected to Facebook Page &quot;{params.fb_connected}&quot; with a long-lived token.
        </div>
      )}
      {params.fb_error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Facebook connection failed: {params.fb_error}
        </div>
      )}
      {params.tiktok_error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          TikTok connection failed: {params.tiktok_error}
        </div>
      )}

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
          description="Requires an Instagram Business account connected to a Facebook Page, with the Instagram Graph API messaging permission. Connects automatically when you connect the linked Facebook Page above."
          connection={instagram}
          webhookUrl={`${origin}/api/webhooks/instagram/${instagram.id}`}
        />
      </div>

      <div className="max-w-md">
        <TikTokAdsConnectionCard connection={tiktok} />
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Email Sending (Campaigns)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify your own domain in your own Resend account, then enter the address here.
            Until then, campaigns send from Resend&apos;s shared test address.
          </p>
          <form action={updateEmailSettings} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="emailFromName">From name</Label>
              <Input
                id="emailFromName"
                name="emailFromName"
                defaultValue={business?.emailFromName ?? ""}
                placeholder="e.g. Interstate Auto Center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailFromAddress">From address</Label>
              <Input
                id="emailFromAddress"
                name="emailFromAddress"
                type="email"
                defaultValue={business?.emailFromAddress ?? ""}
                placeholder="hello@yourdomain.com"
              />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
