"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAgent } from "@/lib/current-agent";

export async function getCommentReplies() {
  const agent = await getCurrentAgent();
  return prisma.commentReply.findMany({
    where: { businessId: agent.businessId },
    orderBy: { createdAt: "desc" },
  });
}
