"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdminAction, getCurrentAgent, getCurrentBusiness } from "@/lib/current-agent";
import { sendCampaignEmail, resolveFromAddress } from "@/lib/email/resend";
import type { AgentRole } from "@prisma/client";

export async function getAgents() {
  const agent = await getCurrentAgent();
  return prisma.agent.findMany({
    where: { businessId: agent.businessId },
    orderBy: { name: "asc" },
  });
}

/** Adds a team member to the current admin's business. Signup creates the
 * very first agent for a brand-new Business directly (see auth.ts), since no
 * session exists yet at that point — this is always post-login. */
export async function createAgent(formData: FormData) {
  const currentAgent = await requireAdminAction();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const requestedRole = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";

  if (!name || !email) throw new Error("Name and email are required");

  await prisma.agent.create({
    data: { businessId: currentAgent.businessId, name, email, role: requestedRole },
  });

  revalidatePath("/settings/team");

  // Best-effort — the agent is already created and can still sign in at
  // /login/{slug} even if this fails (e.g. no verified sending domain yet).
  try {
    const business = await getCurrentBusiness();
    const hdrs = await headers();
    const host = hdrs.get("host") ?? "localhost:3000";
    const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
    const loginUrl = `${origin}/login/${business.slug}`;

    await sendCampaignEmail({
      from: resolveFromAddress(business.emailFromName, business.emailFromAddress),
      to: email,
      subject: `You've been added to ${business.name} on AI BOS CRM`,
      html: `<p>Hi ${name},</p><p>${currentAgent.name} added you as a ${requestedRole === "ADMIN" ? "admin" : "team member"} on ${business.name}'s AI BOS CRM.</p><p><a href="${loginUrl}">${loginUrl}</a></p><p>Sign in with this email address — since this is your first time, whatever password you type in will become your password.</p>`,
    });
  } catch {
    // Swallowed intentionally — see comment above.
  }
}

export async function updateAgentRole(agentId: string, role: AgentRole) {
  const currentAgent = await requireAdminAction();

  if (currentAgent.id === agentId && role !== "ADMIN") {
    const adminCount = await prisma.agent.count({
      where: { businessId: currentAgent.businessId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new Error("You can't demote the last admin.");
    }
  }

  await prisma.agent.updateMany({
    where: { id: agentId, businessId: currentAgent.businessId },
    data: { role },
  });
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
  await prisma.agent.deleteMany({
    where: { id: agentId, businessId: currentAgent.businessId },
  });
  revalidatePath("/settings/team");
}
