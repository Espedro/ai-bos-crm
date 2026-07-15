import { getContacts } from "@/lib/actions/contacts";
import { getCompanies } from "@/lib/actions/companies";
import { getAgents } from "@/lib/actions/agents";
import { NewContactDialog } from "@/components/new-contact-dialog";
import { ContactsWorkspace } from "@/components/contacts-workspace";

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
          <h1 className="text-[28px] font-bold tracking-tight">Lead Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} total contact{contacts.length === 1 ? "" : "s"} — search, score, and inspect
            every lead.
          </p>
        </div>
        <NewContactDialog companies={companies} agents={agents} />
      </div>

      <ContactsWorkspace contacts={contacts} />
    </div>
  );
}
