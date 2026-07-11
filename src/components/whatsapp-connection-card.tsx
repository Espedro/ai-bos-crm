"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyableField } from "@/components/copyable-field";
import { ChannelIcon } from "@/components/channel-icon";
import { WhatsAppEmbeddedSignupButton } from "@/components/whatsapp-embedded-signup-button";
import { saveWhatsAppCredentials, disconnectChannel } from "@/lib/actions/channels";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  CONNECTED: "default",
  DISCONNECTED: "secondary",
  ERROR: "destructive",
};

type Connection = {
  id: string;
  status: string;
  displayName: string | null;
  phoneNumberId: string | null;
  wabaId: string | null;
  accessToken: string | null;
  webhookVerifyToken: string;
  lastErrorMessage: string | null;
};

export function WhatsAppConnectionCard({
  connection,
  webhookUrl,
}: {
  connection: Connection;
  webhookUrl: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ChannelIcon channel="WHATSAPP" />
          <CardTitle>WhatsApp Business</CardTitle>
        </div>
        <Badge variant={statusVariant[connection.status]}>{connection.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your WhatsApp Business Account directly — no Meta Developer app needed.
        </p>

        <WhatsAppEmbeddedSignupButton />

        <div className="grid gap-4 rounded-lg border bg-muted/30 p-3">
          <CopyableField label="Webhook Callback URL" value={webhookUrl} />
          <CopyableField label="Verify Token" value={connection.webhookVerifyToken} />
        </div>

        <details className="space-y-3">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Or paste credentials manually from your own Meta Developer app
          </summary>
        <form action={saveWhatsAppCredentials} className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label htmlFor="wa-displayName">Label (for your reference)</Label>
            <Input
              id="wa-displayName"
              name="displayName"
              defaultValue={connection.displayName ?? ""}
              placeholder="e.g. Main business number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wa-phoneNumberId">Phone Number ID</Label>
              <Input
                id="wa-phoneNumberId"
                name="phoneNumberId"
                defaultValue={connection.phoneNumberId ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-wabaId">WhatsApp Business Account ID</Label>
              <Input id="wa-wabaId" name="wabaId" defaultValue={connection.wabaId ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-accessToken">Access Token</Label>
            <Input
              id="wa-accessToken"
              name="accessToken"
              type="password"
              defaultValue={connection.accessToken ?? ""}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save & Connect</Button>
            {connection.status !== "DISCONNECTED" && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  if (!window.confirm("Disconnect WhatsApp? Customers won't get AI replies on this channel until you reconnect it.")) {
                    return;
                  }
                  startTransition(() => disconnectChannel("WHATSAPP"));
                }}
              >
                Disconnect
              </Button>
            )}
          </div>
        </form>
        </details>

        {connection.lastErrorMessage && (
          <p className="text-xs text-destructive">Last error: {connection.lastErrorMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
