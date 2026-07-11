"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAgents() {
  return prisma.agent.findMany({ orderBy: { name: "asc" } });
}

export async function createAgent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name || !email) throw new Error("Name and email are required");

  await prisma.agent.create({ data: { name, email } });

  revalidatePath("/setup");
  revalidatePath("/settings/team");
}
