"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/current-agent";
import type { AgentRole } from "@prisma/client";

export async function getAgents() {
  return prisma.agent.findMany({ orderBy: { name: "asc" } });
}

export async function createAgent(formData: FormData) {
  // The setup wizard creates the very first agent before any session exists,
  // so only enforce the admin check once the team already has members.
  const existingCount = await prisma.agent.count();
  if (existingCount > 0) {
    await requireAdminAction();
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const requestedRole = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";

  if (!name || !email) throw new Error("Name and email are required");

  await prisma.agent.create({
    data: { name, email, role: existingCount === 0 ? "ADMIN" : requestedRole },
  });

  revalidatePath("/setup");
  revalidatePath("/settings/team");
}

export async function updateAgentRole(agentId: string, role: AgentRole) {
  const currentAgent = await requireAdminAction();

  if (currentAgent.id === agentId && role !== "ADMIN") {
    const adminCount = await prisma.agent.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("You can't demote the last admin.");
    }
  }

  await prisma.agent.update({ where: { id: agentId }, data: { role } });
  revalidatePath("/settings/team");
}

export async function deleteAgent(agentId: string) {
  const currentAgent = await requireAdminAction();

  if (currentAgent.id === agentId) {
    throw new Error("You can't remove your own account — ask another admin to do it.");
  }

  // Unassigns (rather than blocking) anywhere this agent was referenced —
  // Contact/Deal/Task/Note/Conversation all have this as an optional,
  // ON DELETE SET NULL foreign key.
  await prisma.agent.delete({ where: { id: agentId } });
  revalidatePath("/settings/team");
}
