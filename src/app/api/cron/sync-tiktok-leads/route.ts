import { NextRequest, NextResponse } from "next/server";
import { syncTikTokLeads } from "@/lib/channels/tiktokLeadSync";

export async function GET(request: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const result = await syncTikTokLeads();
    return NextResponse.json(result);
  } catch (error) {
    console.error("TikTok lead sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
