import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { buildFacebookOAuthUrl } from "@/lib/channels/facebookOAuth";
import { requireAdminPage } from "@/lib/current-agent";

const STATE_COOKIE = "fb_oauth_state";

export async function GET() {
  const agent = await requireAdminPage();

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/facebook/callback`;

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, JSON.stringify({ state, businessId: agent.businessId }), {
    httpOnly: true,
    secure: protocol === "https",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return Response.redirect(buildFacebookOAuthUrl(redirectUri, state));
}
