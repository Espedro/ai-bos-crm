import { getContacts } from "@/lib/actions/contacts";
import { getCompanies } from "@/lib/actions/companies";
import { getAgents } from "@/lib/actions/agents";
import { NewContactDialog } from "@/components/new-contact-dialog";
import { ContactsTable } from "@/components/contacts-table";

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

      <ContactsTable contacts={contacts} />
    </div>
  );
}
