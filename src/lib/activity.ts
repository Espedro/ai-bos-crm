import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@prisma/client";

export function logActivity(params: {
  type: ActivityType;
  description: string;
  contactId?: string;
  dealId?: string;
}) {
  return prisma.activityEvent.create({ data: params });
}

export function getRecentActivity(take = 8) {
  return prisma.activityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { contact: true, deal: true },
  });
}
