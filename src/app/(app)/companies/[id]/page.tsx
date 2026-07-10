import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompany } from "@/lib/actions/companies";
import { getAgents } from "@/lib/actions/agents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteForm } from "@/components/note-form";
import { formatDistanceToNow } from "date-fns";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [company, agents] = await Promise.all([getCompany(id), getAgents()]);

  if (!company) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
        <p className="text-sm text-muted-foreground">
          {company.industry ?? "No industry set"} · {company.website ?? "No website"}
        </p>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-2">
          {company.contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                  {contact.firstName} {contact.lastName}
                </Link>
                <Badge variant="secondary">{contact.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {company.contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
          )}
        </TabsContent>

        <TabsContent value="deals" className="space-y-2">
          {company.deals.map((deal) => (
            <Card key={deal.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </p>
                </div>
                <Badge variant="secondary">{deal.stage.name}</Badge>
              </CardContent>
            </Card>
          ))}
          {company.deals.length === 0 && (
            <p className="text-sm text-muted-foreground">No deals yet.</p>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <NoteForm companyId={company.id} agents={agents} />
          <div className="space-y-3">
            {company.notes.map((note) => (
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
            {company.notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
