import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  try {
    await prisma.campaignRecipient.updateMany({
      where: { trackingToken: token, clickedAt: null },
      data: { clickedAt: new Date() },
    });
  } catch (error) {
    console.error("Click tracking update failed:", error);
  }

  return NextResponse.redirect(url);
}
