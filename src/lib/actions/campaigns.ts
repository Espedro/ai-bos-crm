"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ContactStatus } from "@prisma/client";
import { requireAdminAction } from "@/lib/current-agent";
import { sendCampaignCore } from "@/lib/campaign-sender";
import { recipientWhere } from "@/lib/campaign-recipients";

export async function getCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } },
  });
}

export async function getCampaign(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: { recipients: { include: { contact: true } } },
  });
}

export async function countMatchingContacts(filterTag: string | null, filterStatus: ContactStatus | null) {
  return prisma.contact.count({ where: recipientWhere(filterTag, filterStatus) });
}

export async function createCampaign(formData: FormData) {
  await requireAdminAction();

  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !subject || !body) throw new Error("Name, subject, and body are required");

  const campaign = await prisma.campaign.create({
    data: {
      name,
      subject,
      body,
      filterTag: String(formData.get("filterTag") ?? "").trim() || null,
      filterStatus: (String(formData.get("filterStatus") ?? "") as ContactStatus) || null,
    },
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function deleteCampaign(id: string) {
  await requireAdminAction();
  await prisma.campaign.delete({ where: { id } });
  revalidatePath("/campaigns");
}

/** Admin-gated wrapper around the real send logic in `@/lib/campaign-sender` — the
 * cron route calls `sendCampaignCore` directly since it has no user session. */
export async function sendCampaign(id: string) {
  await requireAdminAction();
  await sendCampaignCore(id);
}

export async function scheduleCampaign(id: string, scheduledAt: Date) {
  await requireAdminAction();
  await prisma.campaign.update({
    where: { id },
    data: { status: "SCHEDULED", scheduledAt },
  });
  revalidatePath(`/campaigns/${id}`);
}

export async function cancelSchedule(id: string) {
  await requireAdminAction();
  await prisma.campaign.update({
    where: { id },
    data: { status: "DRAFT", scheduledAt: null },
  });
  revalidatePath(`/campaigns/${id}`);
}
