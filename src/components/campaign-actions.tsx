"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendCampaign, scheduleCampaign, cancelSchedule } from "@/lib/actions/campaigns";

export function CampaignActions({
  campaignId,
  status,
  recipientCount,
}: {
  campaignId: string;
  status: string;
  recipientCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [scheduling, setScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  if (status === "SENT" || status === "SENDING") {
    return (
      <p className="text-sm text-muted-foreground">
        {status === "SENDING" ? "Sending…" : "This campaign has been sent."}
      </p>
    );
  }

  if (status === "SCHEDULED") {
    return (
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => cancelSchedule(campaignId))}
      >
        Cancel Schedule
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={isPending || recipientCount === 0}
          onClick={() => {
            if (!confirm(`Send this campaign to ${recipientCount} contact(s) now?`)) return;
            startTransition(() => sendCampaign(campaignId));
          }}
        >
          {isPending ? "Sending…" : `Send Now (${recipientCount})`}
        </Button>
        <Button variant="outline" onClick={() => setScheduling((v) => !v)}>
          Schedule for later
        </Button>
      </div>
      {scheduling && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-auto"
            />
            <Button
              size="sm"
              disabled={!scheduledAt || isPending}
              onClick={() =>
                startTransition(() => scheduleCampaign(campaignId, new Date(scheduledAt)))
              }
            >
              Confirm
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Checked once daily (~1pm UTC) on the current plan, so it sends the first check after
            this date/time, not the exact minute. Upgrade the Vercel plan for precise timing.
          </p>
        </div>
      )}
    </div>
  );
}
