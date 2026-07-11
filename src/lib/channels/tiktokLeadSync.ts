import { prisma } from "@/lib/prisma";
import { fetchRecentLeads, type TikTokLeadRaw } from "@/lib/channels/tiktokAds";
import { generateAiReply } from "@/lib/ai/aiEmployee";
import { resolveFromAddress, sendCampaignEmail } from "@/lib/email/resend";
import type { TikTokAdsConnection } from "@prisma/client";

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

async function syncLeadsForConnection(connection: TikTokAdsConnection): Promise<number> {
  if (connection.status !== "CONNECTED" || !connection.accessToken || !connection.advertiserId) {
    return 0;
  }

  const businessId = connection.businessId;
  const [resources, business] = await Promise.all([
    prisma.businessResource.findMany({ where: { businessId } }),
    prisma.business.findUnique({ where: { id: businessId } }),
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
      ? await prisma.contact.findFirst({ where: { email, businessId } })
      : phone
        ? await prisma.contact.findFirst({ where: { phone, businessId } })
        : null;

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          businessId,
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
        businessId,
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
          business?.name
        );
        await sendCampaignEmail({
          from: resolveFromAddress(business?.emailFromName, business?.emailFromAddress),
          to: email,
          subject: business?.name ? `Thanks for your interest — ${business.name}` : "Thanks for your interest!",
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

  return processed;
}

/**
 * Polled on a schedule (see /api/cron/sync-tiktok-leads) since TikTok's
 * Lead Generation API has no self-serve real-time webhook — only
 * TikTok-certified CRM partners get push delivery. Creates/updates a
 * Contact per new lead and has the AI Employee send a first-touch email.
 * Loops over every business's connected TikTokAdsConnection (one per
 * business, enforced by a unique businessId), not just one global account.
 *
 * WhatsApp follow-up is deliberately NOT attempted here: messaging someone
 * who hasn't messaged the business first requires a pre-approved WhatsApp
 * message template, not the free-form replies generateAiReply produces
 * everywhere else in this app — that's separate, not-yet-built work.
 */
export async function syncTikTokLeads(): Promise<{ processed: number }> {
  const connections = await prisma.tikTokAdsConnection.findMany({
    where: { status: "CONNECTED" },
  });

  let processed = 0;
  for (const connection of connections) {
    processed += await syncLeadsForConnection(connection);
  }

  return { processed };
}
