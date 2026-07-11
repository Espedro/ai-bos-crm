import "server-only";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { resolveFromAddress, sendCampaignEmail } from "@/lib/email/resend";
import { injectTracking } from "@/lib/email/tracking";
import { recipientWhere } from "@/lib/campaign-recipients";

/**
 * The actual send implementation, callable without a logged-in session —
 * used both by the admin-gated `sendCampaign` action and by the scheduled-
 * send cron route (authenticated separately via CRON_SECRET).
 */
export async function sendCampaignCore(id: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id } });
  const [profile, hdrs] = await Promise.all([prisma.businessProfile.findFirst(), headers()]);
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
