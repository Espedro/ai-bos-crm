import { getTasks } from "@/lib/actions/tasks";
import { getContacts } from "@/lib/actions/contacts";
import { getAgents } from "@/lib/actions/agents";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { TasksList } from "@/components/tasks-list";

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

      <TasksList tasks={tasks} />
    </div>
  );
}
