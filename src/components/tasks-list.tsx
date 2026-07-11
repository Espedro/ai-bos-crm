"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { TaskCheckbox } from "@/components/task-checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import type { getTasks } from "@/lib/actions/tasks";

type Task = Awaited<ReturnType<typeof getTasks>>[number];
type Filter = "all" | "overdue" | "today" | "completed";

function isOverdue(task: Task) {
  return !task.completed && !!task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate);
}
function isDueToday(task: Task) {
  return !task.completed && !!task.dueDate && isToday(task.dueDate);
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due Today" },
  { value: "completed", label: "Completed" },
];

export function TasksList({ tasks }: { tasks: Task[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () => ({
      all: tasks.length,
      overdue: tasks.filter(isOverdue).length,
      today: tasks.filter(isDueToday).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks]
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "overdue":
        return tasks.filter(isOverdue);
      case "today":
        return tasks.filter(isDueToday);
      case "completed":
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }, [filter, tasks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {f.label} <span className="tabular-nums opacity-70">({counts[f.value]})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((task) => {
          const overdue = isOverdue(task);
          const dueToday = isDueToday(task);

          return (
            <Card key={task.id} className="animate-in fade-in-0">
              <CardContent className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-3">
                  <TaskCheckbox id={task.id} completed={task.completed} />
                  <div>
                    <p className={task.completed ? "text-muted-foreground line-through" : ""}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.contact && (
                        <Link href={`/contacts/${task.contact.id}`} className="hover:underline">
                          {task.contact.firstName} {task.contact.lastName}
                        </Link>
                      )}
                      {task.contact && " · "}
                      {task.assignedAgent?.name ?? "Unassigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {overdue && <Badge variant="destructive">Overdue</Badge>}
                  {dueToday && <Badge>Due Today</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {task.dueDate ? format(task.dueDate, "PPP") : "No due date"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <CheckSquare className="size-8" />
            <p className="text-sm">
              {filter === "all" ? "No tasks yet." : `No ${filter === "today" ? "tasks due today" : filter} tasks.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
