import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCampaignCore } from "@/lib/campaign-sender";

/**
 * Polled by Vercel Cron (see vercel.json) to fire campaigns whose
 * scheduledAt has arrived. Vercel signs cron requests with this bearer
 * token when CRON_SECRET is set — see https://vercel.com/docs/cron-jobs.
 */
export async function GET(request: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const due = await prisma.campaign.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
  });

  for (const campaign of due) {
    try {
      await sendCampaignCore(campaign.id);
    } catch (error) {
      console.error(`Scheduled send failed for campaign ${campaign.id}:`, error);
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "FAILED" },
      });
    }
  }

  return NextResponse.json({ processed: due.length });
}
