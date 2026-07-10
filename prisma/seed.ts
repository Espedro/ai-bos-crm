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
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.businessResource.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.agent.deleteMany();

  const stages = await Promise.all(
    STAGES.map((name, order) => prisma.stage.create({ data: { name, order } }))
  );

  const [alice, ben] = await Promise.all([
    prisma.agent.create({ data: { name: "Alice Moreau", email: "alice@aibos.dev" } }),
    prisma.agent.create({ data: { name: "Ben Charles", email: "ben@aibos.dev" } }),
  ]);

  const company = await prisma.company.create({
    data: {
      name: "Auto Excellence SA",
      industry: "Automotive",
      website: "https://autoexcellence.example.com",
      phone: "+509 3700 0000",
      tags: "dealership,vip",
    },
  });

  const contact = await prisma.contact.create({
    data: {
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
      type: "CONTACT_CREATED",
      description: "Jean Baptiste was added as a contact.",
      contactId: contact.id,
    },
  });

  const secondContact = await prisma.contact.create({
    data: {
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
      type: "CONTACT_CREATED",
      description: "Marie Louis was added as a contact.",
      contactId: secondContact.id,
    },
  });

  const deal = await prisma.deal.create({
    data: {
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
      type: "DEAL_CREATED",
      description: "Deal 'SUV Financing Deal' created.",
      contactId: contact.id,
      dealId: deal.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Follow up on financing application",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      contactId: contact.id,
      dealId: deal.id,
      assignedAgentId: alice.id,
    },
  });

  await prisma.note.create({
    data: {
      body: "Customer is interested in a 48-month financing plan.",
      contactId: contact.id,
      dealId: deal.id,
      authorAgentId: alice.id,
    },
  });

  await prisma.businessResource.create({
    data: {
      title: "SUV Financing Plan",
      category: "PRODUCT",
      content:
        "We offer 24, 36, and 48-month financing plans on all SUVs with 0% down for qualified buyers.",
    },
  });

  const conversation = await prisma.conversation.create({
    data: { contactId: contact.id },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        sender: "CUSTOMER",
        body: "Eske nou gen finansman pou SUV?",
      },
      {
        conversationId: conversation.id,
        sender: "AI",
        body: 'Men sa m jwenn sou "SUV Financing Plan":\n\nWe offer 24, 36, and 48-month financing plans on all SUVs with 0% down for qualified buyers.',
      },
    ],
  });

  await prisma.activityEvent.create({
    data: {
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
