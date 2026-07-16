"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAgent } from "@/lib/current-agent";

export async function getLeadTrend(days = 14) {
  const agent = await getCurrentAgent();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const leads = await prisma.contact.findMany({
    where: { businessId: agent.businessId, status: "LEAD", createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const lead of leads) {
    const key = lead.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    label: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count,
  }));
}

/** Average time between a customer's message and the AI's first reply to
 * it, across conversations touched in the last `days` days — only the
 * first CUSTOMER→AI gap per conversation counts, so a slow first reply
 * isn't hidden by fast follow-ups later in the same thread. */
export async function getAvgFirstReplySeconds(days = 7): Promise<number | null> {
  const agent = await getCurrentAgent();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const conversations = await prisma.conversation.findMany({
    where: { businessId: agent.businessId, updatedAt: { gte: since } },
    select: {
      messages: {
        where: { sender: { in: ["CUSTOMER", "AI"] } },
        orderBy: { createdAt: "asc" },
        select: { sender: true, createdAt: true },
      },
    },
  });

  const gaps: number[] = [];
  for (const conv of conversations) {
    for (let i = 0; i < conv.messages.length - 1; i++) {
      if (conv.messages[i].sender === "CUSTOMER" && conv.messages[i + 1].sender === "AI") {
        gaps.push((conv.messages[i + 1].createdAt.getTime() - conv.messages[i].createdAt.getTime()) / 1000);
        break;
      }
    }
  }

  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}
