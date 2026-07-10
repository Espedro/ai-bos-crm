import { prisma } from "@/lib/prisma";
import { fetchRecentLeads, type TikTokLeadRaw } from "@/lib/channels/tiktokAds";
import { generateAiReply } from "@/lib/ai/aiEmployee";
import { resolveFromAddress, sendCampaignEmail } from "@/lib/email/resend";

function extractField(lead: TikTokLeadRaw, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = lead[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Renders whatever TikTok sent back for a lead as a readable summary, since
 * the exact custom-question field names aren't documented (see
 * tiktokAds.ts) — used to ground the AI Employee's first-touch reply.
 */
function summarizeLead(lead: TikTokLeadRaw): string {
  return Object.entries(lead)
    .filter(([key]) => !["lead_id", "id"].includes(key))
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");
}

/**
 * Polled on a schedule (see /api/cron/sync-tiktok-leads) since TikTok's
 * Lead Generation API has no self-serve real-time webhook — only
 * TikTok-certified CRM partners get push delivery. Creates/updates a
 * Contact per new lead and has the AI Employee send a first-touch email.
 *
 * WhatsApp follow-up is deliberately NOT attempted here: messaging someone
 * who hasn't messaged the business first requires a pre-approved WhatsApp
 * message template, not the free-form replies generateAiReply produces
 * everywhere else in this app — that's separate, not-yet-built work.
 */
export async function syncTikTokLeads(): Promise<{ processed: number }> {
  const connection = await prisma.tikTokAdsConnection.findFirst();
  if (
    !connection ||
    connection.status !== "CONNECTED" ||
    !connection.accessToken ||
    !connection.advertiserId
  ) {
    return { processed: 0 };
  }

  const [resources, profile] = await Promise.all([
    prisma.businessResource.findMany(),
    prisma.businessProfile.findFirst(),
  ]);

  let leads: TikTokLeadRaw[];
  try {
    leads = await fetchRecentLeads(connection.accessToken, connection.advertiserId);
  } catch (error) {
    await prisma.tikTokAdsConnection.update({
      where: { id: connection.id },
      data: {
        status: "ERROR",
        lastErrorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }

  let processed = 0;
  for (const lead of leads) {
    const externalLeadId = extractField(lead, ["lead_id", "id"]);
    if (!externalLeadId) continue;

    const existing = await prisma.tikTokLead.findUnique({ where: { externalLeadId } });
    if (existing) continue;

    const email = extractField(lead, ["email"]);
    const phone = extractField(lead, ["phone_number", "phone"]);
    const name = extractField(lead, ["name", "full_name"]) ?? "TikTok Lead";
    const [firstName, ...rest] = name.split(" ");

    let contact = email
      ? await prisma.contact.findFirst({ where: { email } })
      : phone
        ? await prisma.contact.findFirst({ where: { phone } })
        : null;

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName: firstName || "TikTok",
          lastName: rest.join(" ") || "Lead",
          email: email ?? null,
          phone: phone ?? null,
          tags: "tiktok-lead",
        },
      });
    }

    await prisma.tikTokLead.create({
      data: {
        connectionId: connection.id,
        externalLeadId,
        contactId: contact.id,
        data: JSON.stringify(lead),
      },
    });

    if (email) {
      try {
        const { reply } = await generateAiReply(
          [],
          `Hi, I just filled out your form on TikTok — here's what I'm interested in: ${summarizeLead(lead)}`,
          resources,
          profile?.name
        );
        await sendCampaignEmail({
          from: resolveFromAddress(profile?.emailFromName, profile?.emailFromAddress),
          to: email,
          subject: profile?.name ? `Thanks for your interest — ${profile.name}` : "Thanks for your interest!",
          html: reply
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => `<p>${line}</p>`)
            .join(""),
        });
      } catch (error) {
        console.error(`TikTok lead follow-up email failed for contact ${contact.id}:`, error);
      }
    }

    processed++;
  }

  await prisma.tikTokAdsConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date(), status: "CONNECTED", lastErrorMessage: null },
  });

  return { processed };
}
