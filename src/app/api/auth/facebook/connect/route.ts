import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { buildFacebookOAuthUrl } from "@/lib/channels/facebookOAuth";

const STATE_COOKIE = "fb_oauth_state";

export async function GET() {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/facebook/callback`;

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: protocol === "https",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return Response.redirect(buildFacebookOAuthUrl(redirectUri, state));
}
