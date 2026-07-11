import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Agent } from "@prisma/client";

export async function getCurrentAgent(): Promise<Agent> {
  const session = await getSession();
  if (!session) redirect("/login");

  const agent = await prisma.agent.findUnique({ where: { id: session.agentId } });
  if (!agent) redirect("/login");

  return agent;
}

/** Use at the top of an admin-only page — sends non-admins back to the dashboard. */
export async function requireAdminPage(): Promise<Agent> {
  const agent = await getCurrentAgent();
  if (agent.role !== "ADMIN") redirect("/");
  return agent;
}

/** Use at the top of an admin-only server action — rejects instead of redirecting. */
export async function requireAdminAction(): Promise<Agent> {
  const agent = await getCurrentAgent();
  if (agent.role !== "ADMIN") throw new Error("Only an admin can do this.");
  return agent;
}

/**
 * Same admin check, but skipped entirely while the business hasn't finished
 * the /setup wizard yet — during onboarding there's no session possible
 * (the very first Agent/channel connection is being created), so these
 * actions must stay open until `completeSetup` runs.
 */
export async function requireAdminActionIfOnboarded(): Promise<void> {
  const profile = await prisma.businessProfile.findFirst();
  if (!profile?.completedAt) return;
  await requireAdminAction();
}
