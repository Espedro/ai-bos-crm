"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, getCurrentAgent } from "@/lib/current-agent";
import type { ContactStatus } from "@prisma/client";

export async function getContacts() {
  const agent = await getCurrentAgent();
  return prisma.contact.findMany({
    where: { businessId: agent.businessId },
    include: {
      company: true,
      assignedAgent: true,
      conversations: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { channel: true, status: true, updatedAt: true },
      },
      _count: { select: { formSubmissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Compact preview for the Contacts list page's detail panel — fetched
 * on-demand per selected row rather than upfront for every contact. */
export async function getContactPreview(id: string) {
  const agent = await getCurrentAgent();
  return prisma.contact.findFirst({
    where: { id, businessId: agent.businessId },
    include: {
      company: true,
      assignedAgent: true,
      conversations: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { channel: true, status: true, updatedAt: true },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 4 },
      _count: { select: { deals: true } },
    },
  });
}

export async function getContact(id: string) {
  const agent = await getCurrentAgent();
  return prisma.contact.findFirst({
    where: { id, businessId: agent.businessId },
    include: {
      company: true,
      assignedAgent: true,
      deals: { include: { stage: true } },
      tasks: { include: { assignedAgent: true }, orderBy: { dueDate: "asc" } },
      notes: { include: { authorAgent: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createContact(formData: FormData) {
  const agent = await getCurrentAgent();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) throw new Error("First and last name are required");

  const companyId = String(formData.get("companyId") ?? "") || null;
  const assignedAgentId = String(formData.get("assignedAgentId") ?? "") || null;

  const contact = await prisma.contact.create({
    data: {
      businessId: agent.businessId,
      firstName,
      lastName,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      status: (String(formData.get("status") ?? "LEAD") as ContactStatus) || "LEAD",
      leadScore: Number(formData.get("leadScore") ?? 0) || 0,
      companyId,
      assignedAgentId,
    },
  });

  await logActivity({
    businessId: agent.businessId,
    type: "CONTACT_CREATED",
    description: `${contact.firstName} ${contact.lastName} was added as a contact.`,
    contactId: contact.id,
  });

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function deleteContact(id: string) {
  const agent = await requireAdminAction();
  await prisma.contact.deleteMany({ where: { id, businessId: agent.businessId } });
  revalidatePath("/contacts");
  redirect("/contacts");
}
