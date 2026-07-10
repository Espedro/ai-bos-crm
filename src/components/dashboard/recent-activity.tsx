import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@prisma/client";
import {
  UserPlus,
  Building2,
  Handshake,
  ArrowRightLeft,
  StickyNote,
  ListPlus,
  CheckCircle2,
  MessageCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

const ACTIVITY_CONFIG: Record<ActivityType, { icon: LucideIcon; classes: string }> = {
  CONTACT_CREATED: { icon: UserPlus, classes: "bg-muted text-muted-foreground" },
  COMPANY_CREATED: { icon: Building2, classes: "bg-muted text-muted-foreground" },
  DEAL_CREATED: { icon: Handshake, classes: "bg-[var(--chart-1)]/15 text-[var(--chart-1)]" },
  STAGE_CHANGED: { icon: ArrowRightLeft, classes: "bg-[var(--chart-5)]/15 text-[var(--chart-5)]" },
  NOTE_ADDED: { icon: StickyNote, classes: "bg-muted text-muted-foreground" },
  TASK_CREATED: { icon: ListPlus, classes: "bg-muted text-muted-foreground" },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    classes: "bg-[var(--status-good)]/15 text-[var(--status-good)]",
  },
  CONVERSATION_STARTED: {
    icon: MessageCircle,
    classes: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  },
  CONVERSATION_ESCALATED: {
    icon: AlertTriangle,
    classes: "bg-[var(--status-warning)]/20 text-[var(--status-serious)]",
  },
};

type ActivityEventWithRelations = {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: Date;
};

export function RecentActivity({ events }: { events: ActivityEventWithRelations[] }) {
  if (events.length === 0) {
    return <p className="px-5 py-6 text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="divide-y">
      {events.map((event) => {
        const config = ACTIVITY_CONFIG[event.type];
        const Icon = config.icon;
        return (
          <div key={event.id} className="flex items-start gap-3 px-5 py-3.5">
            <div
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                config.classes
              )}
            >
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{event.description}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDistanceToNow(event.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
