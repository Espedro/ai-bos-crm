"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyableField } from "@/components/copyable-field";
import { ChannelIcon } from "@/components/channel-icon";
import { saveMetaMessagingCredentials, disconnectChannel } from "@/lib/actions/channels";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  CONNECTED: "default",
  DISCONNECTED: "secondary",
  ERROR: "destructive",
};

type Connection = {
  id: string;
  status: string;
  displayName: string | null;
  pageId: string | null;
  accessToken: string | null;
  webhookVerifyToken: string;
  lastErrorMessage: string | null;
};

export function MetaMessagingConnectionCard({
  channel,
  title,
  pageIdLabel,
  description,
  connection,
  webhookUrl,
  connectHref,
}: {
  channel: "FACEBOOK" | "INSTAGRAM";
  title: string;
  pageIdLabel: string;
  description: string;
  connection: Connection;
  webhookUrl: string;
  connectHref?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ChannelIcon channel={channel} />
          <CardTitle>{title}</CardTitle>
        </div>
        <Badge variant={statusVariant[connection.status]}>{connection.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>

        {connectHref && (
          <a href={connectHref} className={buttonVariants({ className: "w-full" })}>
            Connect with Facebook
          </a>
        )}

        <div className="grid gap-4 rounded-lg border bg-muted/30 p-3">
          <CopyableField label="Webhook Callback URL" value={webhookUrl} />
          <CopyableField label="Verify Token" value={connection.webhookVerifyToken} />
        </div>

        <details className="space-y-3">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            {connectHref ? "Or paste credentials manually" : "Credentials"}
          </summary>
        <form
          action={(formData) => saveMetaMessagingCredentials(channel, formData)}
          className="space-y-3 pt-3"
        >
          <div className="space-y-2">
            <Label htmlFor={`${channel}-displayName`}>Label (for your reference)</Label>
            <Input
              id={`${channel}-displayName`}
              name="displayName"
              defaultValue={connection.displayName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${channel}-pageId`}>{pageIdLabel}</Label>
            <Input
              id={`${channel}-pageId`}
              name="pageId"
              defaultValue={connection.pageId ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${channel}-accessToken`}>Access Token</Label>
            <Input
              id={`${channel}-accessToken`}
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
                  if (!window.confirm(`Disconnect ${title}? Customers won't get AI replies on this channel until you reconnect it.`)) {
                    return;
                  }
                  startTransition(() => disconnectChannel(channel));
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
