import Link from "next/link";
import { getTasks } from "@/lib/actions/tasks";
import { getContacts } from "@/lib/actions/contacts";
import { getAgents } from "@/lib/actions/agents";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { TaskCheckbox } from "@/components/task-checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isToday } from "date-fns";

export default async function TasksPage() {
  const [tasks, contacts, agents] = await Promise.all([
    getTasks(),
    getContacts(),
    getAgents(),
  ]);

  const contactOptions = contacts.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">{tasks.length} total tasks</p>
        </div>
        <NewTaskDialog contacts={contactOptions} agents={agents} />
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const overdue =
            !task.completed && task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate);
          const dueToday = !task.completed && task.dueDate && isToday(task.dueDate);

          return (
            <Card key={task.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-3">
                  <TaskCheckbox id={task.id} completed={task.completed} />
                  <div>
                    <p className={task.completed ? "line-through text-muted-foreground" : ""}>
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
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        )}
      </div>
    </div>
  );
}
