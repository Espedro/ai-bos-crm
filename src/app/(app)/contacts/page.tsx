import Link from "next/link";
import { getContacts } from "@/lib/actions/contacts";
import { getCompanies } from "@/lib/actions/companies";
import { getAgents } from "@/lib/actions/agents";
import { NewContactDialog } from "@/components/new-contact-dialog";
import { EntityAvatar } from "@/components/entity-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  LEAD: "outline",
  QUALIFIED: "secondary",
  CUSTOMER: "default",
};

export default async function ContactsPage() {
  const [contacts, companies, agents] = await Promise.all([
    getContacts(),
    getCompanies(),
    getAgents(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} total contacts
          </p>
        </div>
        <NewContactDialog companies={companies} agents={agents} />
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lead Score</TableHead>
              <TableHead>Assigned Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <EntityAvatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                    <div>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium hover:underline"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{contact.company?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[contact.status]}>
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell>{contact.leadScore}</TableCell>
                <TableCell>{contact.assignedAgent?.name ?? "Unassigned"}</TableCell>
              </TableRow>
            ))}
            {contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No contacts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
