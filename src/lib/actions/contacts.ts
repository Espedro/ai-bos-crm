"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/current-agent";
import type { ContactStatus } from "@prisma/client";

export async function getContacts() {
  return prisma.contact.findMany({
    include: { company: true, assignedAgent: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContact(id: string) {
  return prisma.contact.findUnique({
    where: { id },
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
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) throw new Error("First and last name are required");

  const companyId = String(formData.get("companyId") ?? "") || null;
  const assignedAgentId = String(formData.get("assignedAgentId") ?? "") || null;

  const contact = await prisma.contact.create({
    data: {
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
    type: "CONTACT_CREATED",
    description: `${contact.firstName} ${contact.lastName} was added as a contact.`,
    contactId: contact.id,
  });

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function deleteContact(id: string) {
  await requireAdminAction();
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  redirect("/contacts");
}
