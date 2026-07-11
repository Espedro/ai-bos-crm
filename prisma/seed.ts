import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STAGES = [
  "New Lead",
  "Qualified",
  "Product Presented",
  "Application Link Sent",
  "Application Submitted",
  "Negotiation",
  "Won",
  "Lost",
];

async function main() {
  // Scoped to this seed's own demo business only — never touch other
  // businesses' data (this script runs against the shared production DB).
  const existing = await prisma.business.findUnique({ where: { slug: "aibos-demo" } });
  if (existing) {
    const businessId = existing.id;
    await prisma.message.deleteMany({ where: { businessId } });
    await prisma.conversation.deleteMany({ where: { businessId } });
    await prisma.businessResource.deleteMany({ where: { businessId } });
    await prisma.activityEvent.deleteMany({ where: { businessId } });
    await prisma.note.deleteMany({ where: { businessId } });
    await prisma.task.deleteMany({ where: { businessId } });
    await prisma.deal.deleteMany({ where: { businessId } });
    await prisma.stage.deleteMany({ where: { businessId } });
    await prisma.contact.deleteMany({ where: { businessId } });
    await prisma.company.deleteMany({ where: { businessId } });
    await prisma.agent.deleteMany({ where: { businessId } });
    await prisma.business.delete({ where: { id: businessId } });
  }

  const business = await prisma.business.create({
    data: { slug: "aibos-demo", name: "AI BOS Demo" },
  });
  const businessId = business.id;

  const stages = await Promise.all(
    STAGES.map((name, order) => prisma.stage.create({ data: { businessId, name, order } }))
  );

  const [alice, ben] = await Promise.all([
    prisma.agent.create({
      data: { businessId, name: "Alice Moreau", email: "alice@aibos.dev", role: "ADMIN" },
    }),
    prisma.agent.create({ data: { businessId, name: "Ben Charles", email: "ben@aibos.dev" } }),
  ]);

  const company = await prisma.company.create({
    data: {
      businessId,
      name: "Auto Excellence SA",
      industry: "Automotive",
      website: "https://autoexcellence.example.com",
      phone: "+509 3700 0000",
      tags: "dealership,vip",
    },
  });

  const contact = await prisma.contact.create({
    data: {
      businessId,
      firstName: "Jean",
      lastName: "Baptiste",
      email: "jean.baptiste@example.com",
      phone: "+509 3711 2233",
      status: "QUALIFIED",
      leadScore: 72,
      tags: "hot-lead",
      companyId: company.id,
      assignedAgentId: alice.id,
    },
  });

  await prisma.activityEvent.create({
    data: {
      businessId,
      type: "CONTACT_CREATED",
      description: "Jean Baptiste was added as a contact.",
      contactId: contact.id,
    },
  });

  const secondContact = await prisma.contact.create({
    data: {
      businessId,
      firstName: "Marie",
      lastName: "Louis",
      email: "marie.louis@example.com",
      phone: "+509 3722 4455",
      status: "LEAD",
      leadScore: 35,
      assignedAgentId: ben.id,
    },
  });

  await prisma.activityEvent.create({
    data: {
      businessId,
      type: "CONTACT_CREATED",
      description: "Marie Louis was added as a contact.",
      contactId: secondContact.id,
    },
  });

  const deal = await prisma.deal.create({
    data: {
      businessId,
      title: "SUV Financing Deal",
      value: 25000,
      currency: "USD",
      contactId: contact.id,
      companyId: company.id,
      stageId: stages[3].id, // Application Link Sent
      assignedAgentId: alice.id,
    },
  });

  await prisma.activityEvent.create({
    data: {
      businessId,
      type: "DEAL_CREATED",
      description: "Deal 'SUV Financing Deal' created.",
      contactId: contact.id,
      dealId: deal.id,
    },
  });

  await prisma.task.create({
    data: {
      businessId,
      title: "Follow up on financing application",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      contactId: contact.id,
      dealId: deal.id,
      assignedAgentId: alice.id,
    },
  });

  await prisma.note.create({
    data: {
      businessId,
      body: "Customer is interested in a 48-month financing plan.",
      contactId: contact.id,
      dealId: deal.id,
      authorAgentId: alice.id,
    },
  });

  await prisma.businessResource.create({
    data: {
      businessId,
      title: "SUV Financing Plan",
      category: "PRODUCT",
      content:
        "We offer 24, 36, and 48-month financing plans on all SUVs with 0% down for qualified buyers.",
    },
  });

  const conversation = await prisma.conversation.create({
    data: { businessId, contactId: contact.id },
  });

  await prisma.message.createMany({
    data: [
      {
        businessId,
        conversationId: conversation.id,
        sender: "CUSTOMER",
        body: "Eske nou gen finansman pou SUV?",
      },
      {
        businessId,
        conversationId: conversation.id,
        sender: "AI",
        body: 'Men sa m jwenn sou "SUV Financing Plan":\n\nWe offer 24, 36, and 48-month financing plans on all SUVs with 0% down for qualified buyers.',
      },
    ],
  });

  await prisma.activityEvent.create({
    data: {
      businessId,
      type: "CONVERSATION_STARTED",
      description: "A new WhatsApp conversation was started.",
      contactId: contact.id,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
