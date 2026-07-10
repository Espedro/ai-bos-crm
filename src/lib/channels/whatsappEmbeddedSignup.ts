const GRAPH_API_VERSION = "v22.0";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

/**
 * Embedded Signup's FB.login() runs as a JS SDK popup, not a redirect-based
 * OAuth dialog, so the code exchange has no redirect_uri param (unlike
 * facebookOAuth.ts's exchangeCodeForUserToken, which is the redirect flow).
 */
export async function exchangeEmbeddedSignupCode(code: string): Promise<string> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", requireEnv("FACEBOOK_APP_ID"));
  url.searchParams.set("client_secret", requireEnv("FACEBOOK_APP_SECRET"));
  url.searchParams.set("code", code);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Embedded Signup token exchange failed (${response.status}): ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * The dashboard showing a WABA as "connected" doesn't guarantee our app is
 * subscribed to its webhooks (see feedback_meta_channel_setup gotcha #1) —
 * explicitly subscribe via the Graph API rather than relying on Embedded
 * Signup having done it implicitly.
 */
export async function subscribeAppToWaba(wabaId: string, accessToken: string): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    throw new Error(`Failed to subscribe app to WABA (${response.status}): ${await response.text()}`);
  }
}

export async function fetchPhoneNumberDisplayName(
  phoneNumberId: string,
  accessToken: string
): Promise<string | undefined> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) return undefined;
  const data = (await response.json()) as { display_phone_number?: string; verified_name?: string };
  return data.verified_name ?? data.display_phone_number;
}
