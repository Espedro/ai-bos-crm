const GRAPH_API_VERSION = "v22.0";

/**
 * Permissions needed for: sending/receiving Messenger DMs (pages_messaging),
 * replying to public comments (pages_manage_engagement), receiving comment
 * webhooks (pages_read_engagement), reading the actual comment/post text
 * written by followers (pages_read_user_content — a hard dependency of
 * pages_manage_engagement, Facebook's OAuth dialog rejects the request
 * without it), and listing/subscribing the Page (pages_show_list,
 * pages_manage_metadata).
 *
 * NOT requesting read_page_mailboxes here (needed for Private Reply,
 * see facebookComments.ts) — Meta's OAuth dialog rejects the ENTIRE scope
 * string with "Invalid Scopes" if a permission isn't first enabled for
 * this app in the App Dashboard's Permissions/Use Cases tab (confirmed
 * live 2026-07-12, same pattern as the pages_read_user_content gotcha).
 * Add it back here only after that's done in the dashboard — until then
 * it would break reconnecting Facebook for every business, not just skip
 * the one permission.
 */
const SCOPES = [
  "pages_show_list",
  "pages_messaging",
  "pages_manage_metadata",
  "pages_manage_engagement",
  "pages_read_engagement",
  "pages_read_user_content",
].join(",");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

export function buildFacebookOAuthUrl(redirectUri: string, state: string): string {
  const url = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", requireEnv("FACEBOOK_APP_ID"));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
};

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Graph API ${path} failed (${response.status}): ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export async function exchangeCodeForUserToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const data = await graphGet<{ access_token: string }>("/oauth/access_token", {
    client_id: requireEnv("FACEBOOK_APP_ID"),
    client_secret: requireEnv("FACEBOOK_APP_SECRET"),
    redirect_uri: redirectUri,
    code,
  });
  return data.access_token;
}

/**
 * A Page Access Token derived from a long-lived User Access Token does not
 * expire (until the underlying user token is revoked), which is what fixes
 * the recurring "Session has expired" issue from short-lived tokens pasted
 * in manually.
 */
export async function exchangeForLongLivedUserToken(shortLivedToken: string): Promise<string> {
  const data = await graphGet<{ access_token: string }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: requireEnv("FACEBOOK_APP_ID"),
    client_secret: requireEnv("FACEBOOK_APP_SECRET"),
    fb_exchange_token: shortLivedToken,
  });
  return data.access_token;
}

export async function fetchManagedPages(longLivedUserToken: string): Promise<FacebookPage[]> {
  const data = await graphGet<{ data: FacebookPage[] }>("/me/accounts", {
    fields: "id,name,access_token,instagram_business_account",
    access_token: longLivedUserToken,
  });
  return data.data;
}

/**
 * A Page showing as "connected" in our own DB doesn't mean Meta will push
 * webhook events to us — that requires this app to be explicitly subscribed
 * to the Page (see feedback_meta_channel_setup gotcha #1). Without this,
 * inbound Messenger/comment webhooks simply never arrive, with no error
 * anywhere to signal it.
 */
export async function subscribeAppToPage(pageId: string, pageAccessToken: string): Promise<void> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps`);
  url.searchParams.set("subscribed_fields", "messages,feed");
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to subscribe app to Page (${response.status}): ${await response.text()}`);
  }
}
