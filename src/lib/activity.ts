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
