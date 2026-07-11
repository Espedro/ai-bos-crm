import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForAdvertiserToken } from "@/lib/channels/tiktokAds";

const STATE_COOKIE = "tiktok_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  // TikTok's advertiser OAuth callback param is `auth_code`, not `code`.
  const authCode = url.searchParams.get("auth_code");
  const state = url.searchParams.get("state");

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  let expectedState: string | undefined;
  let businessId: string | undefined;
  try {
    const parsed = rawCookie ? JSON.parse(rawCookie) : null;
    expectedState = parsed?.state;
    businessId = parsed?.businessId;
  } catch {
    // malformed cookie — treated as invalid state below
  }

  if (!authCode || !state || !expectedState || state !== expectedState || !businessId) {
    return Response.redirect(`${origin}/settings/channels?tiktok_error=invalid_state`);
  }

  try {
    const { accessToken, advertiserIds } = await exchangeCodeForAdvertiserToken(authCode);
    const advertiserId = advertiserIds[0];
    if (!advertiserId) {
      return Response.redirect(`${origin}/settings/channels?tiktok_error=no_advertisers_found`);
    }

    const data = {
      accessToken,
      advertiserId,
      displayName: `Advertiser ${advertiserId}`,
      status: "CONNECTED" as const,
      lastErrorMessage: null,
    };
    await prisma.tikTokAdsConnection.upsert({
      where: { businessId },
      update: data,
      create: { businessId, ...data },
    });

    return Response.redirect(`${origin}/settings/channels?tiktok_connected=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.tikTokAdsConnection.updateMany({
      where: { businessId },
      data: { status: "ERROR", lastErrorMessage: message },
    });
    return Response.redirect(`${origin}/settings/channels?tiktok_error=${encodeURIComponent(message)}`);
  }
}
