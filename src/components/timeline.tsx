import { formatDistanceToNow } from "date-fns";

type ActivityEvent = {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
};

const typeLabels: Record<string, string> = {
  CONTACT_CREATED: "Contact created",
  COMPANY_CREATED: "Company created",
  DEAL_CREATED: "Deal created",
  STAGE_CHANGED: "Stage changed",
  NOTE_ADDED: "Note added",
  TASK_CREATED: "Task created",
  TASK_COMPLETED: "Task completed",
};

export function Timeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4 border-l pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
          <p className="text-sm font-medium">{typeLabels[event.type] ?? event.type}</p>
          <p className="text-sm text-muted-foreground">{event.description}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(event.createdAt, { addSuffix: true })}
          </p>
        </li>
      ))}
    </ol>
  );
}
