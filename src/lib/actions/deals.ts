"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function getStages() {
  return prisma.stage.findMany({ orderBy: { order: "asc" } });
}

export async function getDealsByStage() {
  return prisma.stage.findMany({
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
  const title = String(formData.get("title") ?? "").trim();
  const contactId = String(formData.get("contactId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  if (!title || !contactId || !stageId) {
    throw new Error("Title, contact, and stage are required");
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });

  const deal = await prisma.deal.create({
    data: {
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
    type: "DEAL_CREATED",
    description: `Deal '${deal.title}' created.`,
    contactId,
    dealId: deal.id,
  });

  revalidatePath("/deals");
  revalidatePath(`/contacts/${contactId}`);
}

export async function moveDealToStage(dealId: string, stageId: string) {
  const [deal, stage] = await Promise.all([
    prisma.deal.findUniqueOrThrow({ where: { id: dealId } }),
    prisma.stage.findUniqueOrThrow({ where: { id: stageId } }),
  ]);

  if (deal.stageId === stageId) return;

  await prisma.deal.update({ where: { id: dealId }, data: { stageId } });

  await logActivity({
    type: "STAGE_CHANGED",
    description: `Deal '${deal.title}' moved to stage '${stage.name}'.`,
    contactId: deal.contactId,
    dealId: deal.id,
  });

  revalidatePath("/deals");
  revalidatePath(`/contacts/${deal.contactId}`);
}
