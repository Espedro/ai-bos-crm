"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { getCurrentAgent } from "@/lib/current-agent";

export async function getTasks() {
  const agent = await getCurrentAgent();
  return prisma.task.findMany({
    where: { businessId: agent.businessId },
    include: { contact: true, deal: true, assignedAgent: true },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
  });
}

export async function createTask(formData: FormData) {
  const agent = await getCurrentAgent();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required");

  const contactId = String(formData.get("contactId") ?? "") || null;
  const dealId = String(formData.get("dealId") ?? "") || null;
  const dueDateRaw = String(formData.get("dueDate") ?? "");

  const task = await prisma.task.create({
    data: {
      businessId: agent.businessId,
      title,
      description: String(formData.get("description") ?? "") || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      contactId,
      dealId,
      assignedAgentId: String(formData.get("assignedAgentId") ?? "") || null,
    },
  });

  if (contactId) {
    await logActivity({
      businessId: agent.businessId,
      type: "TASK_CREATED",
      description: `Task '${task.title}' created.`,
      contactId,
      dealId: dealId ?? undefined,
    });
  }

  revalidatePath("/tasks");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

export async function toggleTaskCompleted(id: string, completed: boolean) {
  const agent = await getCurrentAgent();
  await prisma.task.updateMany({
    where: { id, businessId: agent.businessId },
    data: { completed },
  });
  const task = await prisma.task.findFirstOrThrow({
    where: { id, businessId: agent.businessId },
  });

  if (completed && task.contactId) {
    await logActivity({
      businessId: agent.businessId,
      type: "TASK_COMPLETED",
      description: `Task '${task.title}' marked complete.`,
      contactId: task.contactId,
      dealId: task.dealId ?? undefined,
    });
  }

  revalidatePath("/tasks");
  if (task.contactId) revalidatePath(`/contacts/${task.contactId}`);
}
