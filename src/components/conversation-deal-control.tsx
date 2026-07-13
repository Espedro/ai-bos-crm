"use client";

import { useTransition } from "react";
import Link from "next/link";
import { moveDealToStage } from "@/lib/actions/deals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Deal = { id: string; title: string; stageId: string };
type Stage = { id: string; name: string };

export function ConversationDealControl({
  deals,
  stages,
}: {
  deals: Deal[];
  stages: Stage[];
}) {
  const [isPending, startTransition] = useTransition();

  if (deals.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {deals.map((deal) => (
        <div key={deal.id} className="flex items-center gap-1.5">
          <Link
            href="/deals"
            className="max-w-[140px] truncate text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            {deal.title}
          </Link>
          <Select
            defaultValue={deal.stageId}
            disabled={isPending}
            onValueChange={(stageId) => {
              if (!stageId) return;
              startTransition(() => moveDealToStage(deal.id, stageId));
            }}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
