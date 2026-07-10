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
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!authCode || !state || !expectedState || state !== expectedState) {
    return Response.redirect(`${origin}/settings/channels?tiktok_error=invalid_state`);
  }

  try {
    const { accessToken, advertiserIds } = await exchangeCodeForAdvertiserToken(authCode);
    const advertiserId = advertiserIds[0];
    if (!advertiserId) {
      return Response.redirect(`${origin}/settings/channels?tiktok_error=no_advertisers_found`);
    }

    const connection = await prisma.tikTokAdsConnection.findFirst();
    const data = {
      accessToken,
      advertiserId,
      displayName: `Advertiser ${advertiserId}`,
      status: "CONNECTED" as const,
      lastErrorMessage: null,
    };
    if (connection) {
      await prisma.tikTokAdsConnection.update({ where: { id: connection.id }, data });
    } else {
      await prisma.tikTokAdsConnection.create({ data });
    }

    return Response.redirect(`${origin}/settings/channels?tiktok_connected=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const connection = await prisma.tikTokAdsConnection.findFirst();
    if (connection) {
      await prisma.tikTokAdsConnection.update({
        where: { id: connection.id },
        data: { status: "ERROR", lastErrorMessage: message },
      });
    }
    return Response.redirect(`${origin}/settings/channels?tiktok_error=${encodeURIComponent(message)}`);
  }
}
