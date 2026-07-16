import { getContacts } from "@/lib/actions/contacts";
import { getCompanies } from "@/lib/actions/companies";
import { getAgents } from "@/lib/actions/agents";
import { NewContactDialog } from "@/components/new-contact-dialog";
import { ContactsWorkspace } from "@/components/contacts-workspace";
import { PageShell } from "@/components/page-shell";

export default async function ContactsPage() {
  const [contacts, companies, agents] = await Promise.all([
    getContacts(),
    getCompanies(),
    getAgents(),
  ]);

  return (
    <PageShell kicker={`${contacts.length} total contact${contacts.length === 1 ? "" : "s"}`} title="Contacts">
      <ContactsWorkspace
        contacts={contacts}
        newContactDialog={<NewContactDialog companies={companies} agents={agents} />}
      />
    </PageShell>
  );
}
