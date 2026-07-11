"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { getCurrentAgent } from "@/lib/current-agent";

export async function getStages() {
  const agent = await getCurrentAgent();
  return prisma.stage.findMany({ where: { businessId: agent.businessId }, orderBy: { order: "asc" } });
}

export async function getDealsByStage() {
  const agent = await getCurrentAgent();
  return prisma.stage.findMany({
    where: { businessId: agent.businessId },
    orderBy: { order: "asc" },
    include: {
      deals: {
        include: { contact: true, company: true, assignedAgent: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createDeal(formData: FormData) {
  const agent = await getCurrentAgent();
  const title = String(formData.get("title") ?? "").trim();
  const contactId = String(formData.get("contactId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  if (!title || !contactId || !stageId) {
    throw new Error("Title, contact, and stage are required");
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, businessId: agent.businessId },
  });

  const deal = await prisma.deal.create({
    data: {
      businessId: agent.businessId,
      title,
      contactId,
      stageId,
      companyId: contact?.companyId ?? null,
      value: Number(formData.get("value") ?? 0) || 0,
      currency: String(formData.get("currency") ?? "USD") || "USD",
      assignedAgentId: String(formData.get("assignedAgentId") ?? "") || null,
    },
  });

  await logActivity({
    businessId: agent.businessId,
    type: "DEAL_CREATED",
    description: `Deal '${deal.title}' created.`,
    contactId,
    dealId: deal.id,
  });

  revalidatePath("/deals");
  revalidatePath(`/contacts/${contactId}`);
}

export async function moveDealToStage(dealId: string, stageId: string) {
  const agent = await getCurrentAgent();
  const [deal, stage] = await Promise.all([
    prisma.deal.findFirstOrThrow({ where: { id: dealId, businessId: agent.businessId } }),
    prisma.stage.findFirstOrThrow({ where: { id: stageId, businessId: agent.businessId } }),
  ]);

  if (deal.stageId === stageId) return;

  await prisma.deal.updateMany({
    where: { id: dealId, businessId: agent.businessId },
    data: { stageId },
  });

  await logActivity({
    businessId: agent.businessId,
    type: "STAGE_CHANGED",
    description: `Deal '${deal.title}' moved to stage '${stage.name}'.`,
    contactId: deal.contactId,
    dealId: deal.id,
  });

  revalidatePath("/deals");
  revalidatePath(`/contacts/${deal.contactId}`);
}
