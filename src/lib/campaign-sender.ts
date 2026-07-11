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
 * send cron route (authenticated separately via CRON_SECRET). When called
 * from an authenticated action, pass the caller's own `businessId` so a
 * campaign belonging to a different tenant can't be triggered by id alone;
 * the cron path omits it and trusts the campaign's own businessId since it
 * already iterates its own scoped query.
 */
export async function sendCampaignCore(id: string, callerBusinessId?: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id } });
  if (callerBusinessId && campaign.businessId !== callerBusinessId) {
    throw new Error("Campaign not found.");
  }
  const businessId = campaign.businessId;

  const [business, hdrs] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    headers(),
  ]);
  const host = hdrs.get("host") ?? "localhost:3000";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const contacts = await prisma.contact.findMany({
    where: recipientWhere(businessId, campaign.filterTag, campaign.filterStatus),
  });

  await prisma.campaign.update({ where: { id }, data: { status: "SENDING" } });

  for (const contact of contacts) {
    await prisma.campaignRecipient.upsert({
      where: { campaignId_contactId: { campaignId: id, contactId: contact.id } },
      update: {},
      create: { businessId, campaignId: id, contactId: contact.id },
    });
  }

  const pending = await prisma.campaignRecipient.findMany({
    where: { campaignId: id, status: "PENDING" },
    include: { contact: true },
  });

  const from = resolveFromAddress(business?.emailFromName, business?.emailFromAddress);
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
