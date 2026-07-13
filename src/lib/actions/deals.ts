"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { getCurrentAgent, requireAdminAction } from "@/lib/current-agent";

export async function getStages() {
  const agent = await getCurrentAgent();
  return prisma.stage.findMany({ where: { businessId: agent.businessId }, orderBy: { order: "asc" } });
}

/** Same as getStages, plus how many deals sit in each — used by the
 * pipeline settings page so an admin can see what deleting a stage would
 * affect before trying. */
export async function getStagesWithDealCounts() {
  const agent = await getCurrentAgent();
  return prisma.stage.findMany({
    where: { businessId: agent.businessId },
    orderBy: { order: "asc" },
    include: { _count: { select: { deals: true } } },
  });
}

export async function createStage(formData: FormData) {
  const agent = await requireAdminAction();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const last = await prisma.stage.findFirst({
    where: { businessId: agent.businessId },
    orderBy: { order: "desc" },
  });

  await prisma.stage.create({
    data: { businessId: agent.businessId, name, order: (last?.order ?? -1) + 1 },
  });

  revalidatePath("/settings/pipeline");
  revalidatePath("/deals");
}

export async function renameStage(stageId: string, name: string) {
  const agent = await requireAdminAction();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  await prisma.stage.updateMany({
    where: { id: stageId, businessId: agent.businessId },
    data: { name: trimmed },
  });

  revalidatePath("/settings/pipeline");
  revalidatePath("/deals");
}

export async function deleteStage(stageId: string) {
  const agent = await requireAdminAction();
  const stage = await prisma.stage.findFirstOrThrow({
    where: { id: stageId, businessId: agent.businessId },
    include: { _count: { select: { deals: true } } },
  });

  if (stage._count.deals > 0) {
    throw new Error(
      `Move or delete the ${stage._count.deals} deal(s) in "${stage.name}" before removing this stage.`
    );
  }

  await prisma.stage.deleteMany({ where: { id: stageId, businessId: agent.businessId } });

  revalidatePath("/settings/pipeline");
  revalidatePath("/deals");
}

export async function moveStage(stageId: string, direction: "up" | "down") {
  const agent = await requireAdminAction();
  const stages = await prisma.stage.findMany({
    where: { businessId: agent.businessId },
    orderBy: { order: "asc" },
  });

  const index = stages.findIndex((s) => s.id === stageId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= stages.length) return;

  const current = stages[index];
  const swapWith = stages[swapIndex];

  await prisma.$transaction([
    prisma.stage.update({ where: { id: current.id }, data: { order: swapWith.order } }),
    prisma.stage.update({ where: { id: swapWith.id }, data: { order: current.order } }),
  ]);

  revalidatePath("/settings/pipeline");
  revalidatePath("/deals");
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
