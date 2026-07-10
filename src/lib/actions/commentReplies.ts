"use server";

import { prisma } from "@/lib/prisma";

export async function getCommentReplies() {
  return prisma.commentReply.findMany({
    orderBy: { createdAt: "desc" },
  });
}
