"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/current-agent";

export async function getCompanies() {
  return prisma.company.findMany({
    include: { _count: { select: { contacts: true, deals: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompany(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { include: { assignedAgent: true } },
      deals: { include: { stage: true, contact: true } },
      notes: { include: { authorAgent: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createCompany(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required");

  const company = await prisma.company.create({
    data: {
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
  await requireAdminAction();
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
  redirect("/companies");
}
