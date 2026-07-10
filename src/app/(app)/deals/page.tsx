import { getDealsByStage } from "@/lib/actions/deals";
import { getContacts } from "@/lib/actions/contacts";
import { getAgents } from "@/lib/actions/agents";
import { KanbanBoard } from "@/components/kanban-board";
import { NewDealDialog } from "@/components/new-deal-dialog";

export default async function DealsPage() {
  const [stages, contacts, agents] = await Promise.all([
    getDealsByStage(),
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
          <h1 className="text-2xl font-semibold tracking-tight">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Drag deals across stages as they progress.
          </p>
        </div>
        <NewDealDialog
          contacts={contactOptions}
          agents={agents}
          stages={stages}
          defaultStageId={stages[0]?.id}
        />
      </div>

      <KanbanBoard stages={stages} />
    </div>
  );
}
