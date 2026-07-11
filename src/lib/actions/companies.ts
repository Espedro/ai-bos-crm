"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, getCurrentAgent } from "@/lib/current-agent";

export async function getCompanies() {
  const agent = await getCurrentAgent();
  return prisma.company.findMany({
    where: { businessId: agent.businessId },
    include: { _count: { select: { contacts: true, deals: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompany(id: string) {
  const agent = await getCurrentAgent();
  return prisma.company.findFirst({
    where: { id, businessId: agent.businessId },
    include: {
      contacts: { include: { assignedAgent: true } },
      deals: { include: { stage: true, contact: true } },
      notes: { include: { authorAgent: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createCompany(formData: FormData) {
  const agent = await getCurrentAgent();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required");

  const company = await prisma.company.create({
    data: {
      businessId: agent.businessId,
      name,
      industry: String(formData.get("industry") ?? "") || null,
      website: String(formData.get("website") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
    },
  });

  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}

export async function deleteCompany(id: string) {
  const agent = await requireAdminAction();
  await prisma.company.deleteMany({ where: { id, businessId: agent.businessId } });
  revalidatePath("/companies");
  redirect("/companies");
}
