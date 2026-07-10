"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ContactStatus, Prisma } from "@prisma/client";
import { resolveFromAddress, sendCampaignEmail } from "@/lib/email/resend";
import { injectTracking } from "@/lib/email/tracking";

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

function recipientWhere(filterTag: string | null, filterStatus: ContactStatus | null) {
  const where: Prisma.ContactWhereInput = { email: { not: null } };
  if (filterTag) where.tags = { contains: filterTag };
  if (filterStatus) where.status = filterStatus;
  return where;
}

export async function countMatchingContacts(filterTag: string | null, filterStatus: ContactStatus | null) {
  return prisma.contact.count({ where: recipientWhere(filterTag, filterStatus) });
}

export async function createCampaign(formData: FormData) {
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
  await prisma.campaign.delete({ where: { id } });
  revalidatePath("/campaigns");
}

/**
 * Sends a campaign now: resolves matching Contacts, creates a
 * CampaignRecipient row per Contact (idempotent — reruns skip already-sent
 * recipients), and sends each email through Resend with tracking injected.
 * Runs with modest concurrency so a large list doesn't run one-at-a-time.
 */
export async function sendCampaign(id: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id } });
  const [profile, hdrs] = await Promise.all([
    prisma.businessProfile.findFirst(),
    headers(),
  ]);
  const host = hdrs.get("host") ?? "localhost:3000";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const contacts = await prisma.contact.findMany({
    where: recipientWhere(campaign.filterTag, campaign.filterStatus),
  });

  await prisma.campaign.update({ where: { id }, data: { status: "SENDING" } });

  for (const contact of contacts) {
    await prisma.campaignRecipient.upsert({
      where: { campaignId_contactId: { campaignId: id, contactId: contact.id } },
      update: {},
      create: { campaignId: id, contactId: contact.id },
    });
  }

  const pending = await prisma.campaignRecipient.findMany({
    where: { campaignId: id, status: "PENDING" },
    include: { contact: true },
  });

  const from = resolveFromAddress(profile?.emailFromName, profile?.emailFromAddress);
  const CONCURRENCY = 10;
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const chunk = pending.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (recipient) => {
        if (!recipient.contact.email) return;
        try {
          const html = injectTracking(campaign.body, recipient.trackingToken, origin);
          await sendCampaignEmail({
            from,
            to: recipient.contact.email!,
            subject: campaign.subject,
            html,
          });
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "SENT", sentAt: new Date() },
          });
        } catch (error) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              errorMessage: error instanceof Error ? error.message : String(error),
            },
          });
        }
      })
    );
  }

  await prisma.campaign.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
}

export async function scheduleCampaign(id: string, scheduledAt: Date) {
  await prisma.campaign.update({
    where: { id },
    data: { status: "SCHEDULED", scheduledAt },
  });
  revalidatePath(`/campaigns/${id}`);
}

export async function cancelSchedule(id: string) {
  await prisma.campaign.update({
    where: { id },
    data: { status: "DRAFT", scheduledAt: null },
  });
  revalidatePath(`/campaigns/${id}`);
}
