const API_VERSION = "v1.3";
const API_BASE = `https://business-api.tiktok.com/open_api/${API_VERSION}`;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

/**
 * TikTok's advertiser OAuth is a separate flow from Meta's — no `scope`
 * query param (permissions are fixed at app-registration time in the
 * business-api.tiktok.com/portal dashboard), and the callback param is
 * `auth_code`, not `code`.
 */
export function buildTikTokOAuthUrl(redirectUri: string, state: string): string {
  const url = new URL("https://business-api.tiktok.com/portal/auth");
  url.searchParams.set("app_id", requireEnv("TIKTOK_APP_ID"));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

type TikTokEnvelope<T> = { code: number; message: string; request_id: string; data: T };

async function tiktokPost<T>(
  path: string,
  body: Record<string, unknown>,
  accessToken?: string
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { "Access-Token": accessToken } : {}),
    },
    body: JSON.stringify(body),
  });
  const envelope = (await response.json()) as TikTokEnvelope<T>;
  if (!response.ok || envelope.code !== 0) {
    throw new Error(`TikTok API ${path} failed: ${envelope.message ?? response.statusText}`);
  }
  return envelope.data;
}

async function tiktokGet<T>(
  path: string,
  params: Record<string, string>,
  accessToken?: string
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url.toString(), {
    headers: accessToken ? { "Access-Token": accessToken } : undefined,
  });
  const envelope = (await response.json()) as TikTokEnvelope<T>;
  if (!response.ok || envelope.code !== 0) {
    throw new Error(`TikTok API ${path} failed: ${envelope.message ?? response.statusText}`);
  }
  return envelope.data;
}

export async function exchangeCodeForAdvertiserToken(
  authCode: string
): Promise<{ accessToken: string; advertiserIds: string[] }> {
  const data = await tiktokPost<{ access_token: string; advertiser_ids: string[] }>(
    "/oauth2/access_token/",
    {
      app_id: requireEnv("TIKTOK_APP_ID"),
      secret: requireEnv("TIKTOK_APP_SECRET"),
      auth_code: authCode,
    }
  );
  return { accessToken: data.access_token, advertiserIds: data.advertiser_ids };
}

export type TikTokLeadRaw = Record<string, unknown> & { lead_id?: string; id?: string };

/**
 * TikTok Lead Generation has no self-serve webhook (real-time push is
 * reserved for TikTok-certified CRM partners) — this pulls leads via the
 * task/create + task/download pair instead, meant to be called on a
 * schedule. The exact request/response field names below are TikTok's
 * documented endpoint paths but an unverified body/response shape (their
 * reference docs are a JS-only SPA this couldn't be scraped from) — treat
 * the first real call as the source of truth and adjust `data` field
 * mapping in the caller if TikTok's actual payload differs.
 */
export async function fetchRecentLeads(
  accessToken: string,
  advertiserId: string
): Promise<TikTokLeadRaw[]> {
  const task = await tiktokPost<{ task_id: string }>(
    "/page/lead/task/",
    { advertiser_id: advertiserId },
    accessToken
  );

  const download = await tiktokGet<{ leads?: TikTokLeadRaw[] } | TikTokLeadRaw[]>(
    "/page/lead/task/download/",
    { advertiser_id: advertiserId, task_id: task.task_id },
    accessToken
  );

  return Array.isArray(download) ? download : (download.leads ?? []);
}
