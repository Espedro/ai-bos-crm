import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForUserToken,
  exchangeForLongLivedUserToken,
  fetchManagedPages,
} from "@/lib/channels/facebookOAuth";

const STATE_COOKIE = "fb_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/facebook/callback`;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (oauthError) {
    return Response.redirect(`${origin}/settings/channels?fb_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return Response.redirect(`${origin}/settings/channels?fb_error=invalid_state`);
  }

  try {
    const shortLivedToken = await exchangeCodeForUserToken(code, redirectUri);
    const longLivedUserToken = await exchangeForLongLivedUserToken(shortLivedToken);
    const pages = await fetchManagedPages(longLivedUserToken);
    const page = pages[0];

    if (!page) {
      return Response.redirect(`${origin}/settings/channels?fb_error=no_pages_found`);
    }

    await prisma.channelConnection.update({
      where: { channel: "FACEBOOK" },
      data: {
        accessToken: page.access_token,
        pageId: page.id,
        displayName: page.name,
        status: "CONNECTED",
        lastErrorMessage: null,
      },
    });

    if (page.instagram_business_account?.id) {
      await prisma.channelConnection.update({
        where: { channel: "INSTAGRAM" },
        data: {
          accessToken: page.access_token,
          pageId: page.instagram_business_account.id,
          displayName: page.name,
          status: "CONNECTED",
          lastErrorMessage: null,
        },
      });
    }

    return Response.redirect(`${origin}/settings/channels?fb_connected=${encodeURIComponent(page.name)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.channelConnection.update({
      where: { channel: "FACEBOOK" },
      data: { status: "ERROR", lastErrorMessage: message },
    });
    return Response.redirect(`${origin}/settings/channels?fb_error=${encodeURIComponent(message)}`);
  }
}
