import { notFound } from "next/navigation";
import Link from "next/link";
import { getContact } from "@/lib/actions/contacts";
import { getAgents } from "@/lib/actions/agents";
import { startConversation } from "@/lib/actions/conversations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityAvatar } from "@/components/entity-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline } from "@/components/timeline";
import { NoteForm } from "@/components/note-form";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { TaskCheckbox } from "@/components/task-checkbox";
import { format, formatDistanceToNow } from "date-fns";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  LEAD: "outline",
  QUALIFIED: "secondary",
  CUSTOMER: "default",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contact, agents] = await Promise.all([getContact(id), getAgents()]);

  if (!contact) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <EntityAvatar name={`${contact.firstName} ${contact.lastName}`} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contact.company ? (
                <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                  {contact.company.name}
                </Link>
              ) : (
                "No company"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[contact.status]}>{contact.status}</Badge>
          <Badge variant="outline">Score: {contact.leadScore}</Badge>
          <form action={startConversation.bind(null, contact.id)}>
            <Button type="submit" size="sm">
              Start Conversation
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{contact.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>{contact.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Assigned Agent</p>
                <p>{contact.assignedAgent?.name ?? "Unassigned"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {contact.tags
                    ? contact.tags
                        .split(",")
                        .filter(Boolean)
                        .map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))
                    : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Timeline events={contact.activities} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <NoteForm contactId={contact.id} agents={agents} />
          <div className="space-y-3">
            {contact.notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  <p className="text-sm">{note.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {note.authorAgent?.name ?? "Unknown"} ·{" "}
                    {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))}
            {contact.notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <NewTaskDialog agents={agents} defaultContactId={contact.id} />
          </div>
          <div className="space-y-2">
            {contact.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div className="flex items-center gap-3">
                    <TaskCheckbox id={task.id} completed={task.completed} />
                    <div>
                      <p className={task.completed ? "line-through text-muted-foreground" : ""}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.dueDate ? format(task.dueDate, "PPP") : "No due date"} ·{" "}
                        {task.assignedAgent?.name ?? "Unassigned"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {contact.tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-2">
          {contact.deals.map((deal) => (
            <Card key={deal.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {deal.currency} {Number(deal.value).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">{deal.stage.name}</Badge>
              </CardContent>
            </Card>
          ))}
          {contact.deals.length === 0 && (
            <p className="text-sm text-muted-foreground">No deals yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
