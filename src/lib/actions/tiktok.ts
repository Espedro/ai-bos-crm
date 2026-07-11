"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminActionIfOnboarded } from "@/lib/current-agent";

/**
 * Ensures a TikTokAdsConnection row exists (upsert-on-first-access, same
 * pattern as getChannelConnections), so the Settings page always has
 * something to render even before the business connects.
 */
export async function getTikTokConnection() {
  const existing = await prisma.tikTokAdsConnection.findFirst();
  if (existing) return existing;
  return prisma.tikTokAdsConnection.create({ data: {} });
}

export async function disconnectTikTok() {
  await requireAdminActionIfOnboarded();
  const connection = await prisma.tikTokAdsConnection.findFirst();
  if (!connection) return;
  await prisma.tikTokAdsConnection.update({
    where: { id: connection.id },
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
