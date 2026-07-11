"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAgent } from "@/lib/current-agent";
import { generateAiReply, type ConversationTurn } from "@/lib/ai/aiEmployee";

/**
 * Lets an agent try out their own business's AI Employee directly in the
 * CRM — grounded in their real BusinessResource knowledge — without
 * needing any channel connected or any Conversation/Contact/Message rows
 * created. Nothing here is persisted; history lives only in the caller's
 * component state.
 */
export async function getAiTestReply(history: ConversationTurn[], message: string) {
  const agent = await getCurrentAgent();

  const [business, resources] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: agent.businessId } }),
    prisma.businessResource.findMany({ where: { businessId: agent.businessId } }),
  ]);

  return generateAiReply(history, message, resources, business.name);
}
