"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminAction, getCurrentAgent } from "@/lib/current-agent";

/**
 * Ensures a TikTokAdsConnection row exists (upsert-on-first-access, same
 * pattern as getChannelConnections), so the Settings page always has
 * something to render even before the business connects.
 */
export async function getTikTokConnection() {
  const agent = await getCurrentAgent();
  return prisma.tikTokAdsConnection.upsert({
    where: { businessId: agent.businessId },
    update: {},
    create: { businessId: agent.businessId },
  });
}

export async function disconnectTikTok() {
  const agent = await requireAdminAction();
  await prisma.tikTokAdsConnection.updateMany({
    where: { businessId: agent.businessId },
    data: {
      accessToken: null,
      advertiserId: null,
      displayName: null,
      status: "DISCONNECTED",
      lastErrorMessage: null,
    },
  });
  revalidatePath("/settings/channels");
}
