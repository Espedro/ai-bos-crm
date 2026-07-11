import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Agent, Business } from "@prisma/client";

export async function getCurrentAgent(): Promise<Agent> {
  const session = await getSession();
  if (!session) redirect("/login");

  const agent = await prisma.agent.findUnique({ where: { id: session.agentId } });
  if (!agent) redirect("/login");

  return agent;
}

/** The current agent's tenant. Use when you need Business fields beyond `businessId`. */
export async function getCurrentBusiness(): Promise<Business> {
  const agent = await getCurrentAgent();
  const business = await prisma.business.findUnique({ where: { id: agent.businessId } });
  if (!business) redirect("/login");
  return business;
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
