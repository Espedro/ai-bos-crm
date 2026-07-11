import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForUserToken,
  exchangeForLongLivedUserToken,
  fetchManagedPages,
  subscribeAppToPage,
} from "@/lib/channels/facebookOAuth";

const STATE_COOKIE = "fb_oauth_state";
const PENDING_PAGES_COOKIE = "fb_pending_pages";

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

  if (oauthError) {
    return Response.redirect(`${origin}/settings/channels?fb_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state || !expectedState || state !== expectedState || !businessId) {
    return Response.redirect(`${origin}/settings/channels?fb_error=invalid_state`);
  }

  try {
    const shortLivedToken = await exchangeCodeForUserToken(code, redirectUri);
    const longLivedUserToken = await exchangeForLongLivedUserToken(shortLivedToken);
    const pages = await fetchManagedPages(longLivedUserToken);

    if (pages.length === 0) {
      return Response.redirect(`${origin}/settings/channels?fb_error=no_pages_found`);
    }

    // A Facebook account that manages more than one Page can't be resolved
    // automatically — picking pages[0] would silently attach a random other
    // business's Page here. Send the admin to a picker instead.
    if (pages.length > 1) {
      cookieStore.set(
        PENDING_PAGES_COOKIE,
        JSON.stringify({ businessId, longLivedUserToken }),
        { httpOnly: true, secure: protocol === "https", sameSite: "lax", maxAge: 600, path: "/" }
      );
      return Response.redirect(`${origin}/settings/channels/select-facebook-page`);
    }

    const page = pages[0];
    await subscribeAppToPage(page.id, page.access_token);

    await prisma.channelConnection.update({
      where: { businessId_channel: { businessId, channel: "FACEBOOK" } },
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
        where: { businessId_channel: { businessId, channel: "INSTAGRAM" } },
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
      where: { businessId_channel: { businessId, channel: "FACEBOOK" } },
      data: { status: "ERROR", lastErrorMessage: message },
    });
    return Response.redirect(`${origin}/settings/channels?fb_error=${encodeURIComponent(message)}`);
  }
}
