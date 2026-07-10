"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { disconnectTikTok } from "@/lib/actions/tiktok";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  CONNECTED: "default",
  DISCONNECTED: "secondary",
  ERROR: "destructive",
};

type Connection = {
  status: string;
  displayName: string | null;
  advertiserId: string | null;
  lastSyncedAt: Date | null;
  lastErrorMessage: string | null;
};

export function TikTokAdsConnectionCard({ connection }: { connection: Connection }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>TikTok Lead Sync</CardTitle>
        <Badge variant={statusVariant[connection.status]}>{connection.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your TikTok Ads account — new TikTok Lead Generation ad leads become
          Contacts automatically, and the AI Employee sends a first-touch email. Only useful
          if you run (or plan to run) paid TikTok Lead Gen ads.
        </p>

        {connection.status === "CONNECTED" ? (
          <div className="space-y-2 text-sm">
            <p>
              Advertiser: <span className="font-mono text-xs">{connection.advertiserId}</span>
            </p>
            {connection.lastSyncedAt && (
              <p className="text-muted-foreground">
                Last synced: {new Date(connection.lastSyncedAt).toLocaleString()}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => startTransition(() => disconnectTikTok())}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <a href="/api/auth/tiktok/connect" className={buttonVariants({ className: "w-full" })}>
            Connect TikTok Ads
          </a>
        )}

        {connection.lastErrorMessage && (
          <p className="text-xs text-destructive">Last error: {connection.lastErrorMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
