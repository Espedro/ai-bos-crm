/**
 * Provisions a brand-new AI BOS CRM deployment for a new client: a fresh
 * Supabase project with the current schema migrated in, plus a new Vercel
 * project wired to this same repo with the DB env vars set.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... npx tsx scripts/provision-client.ts --name "Client Business Name"
 *
 * Required env vars:
 *   SUPABASE_ACCESS_TOKEN  Personal access token from
 *                          supabase.com/dashboard/account/tokens
 *   SUPABASE_ORG_ID        Supabase organization to create the project under
 *                          (find via `npx supabase orgs list` once logged in,
 *                          or GET /v1/organizations)
 *
 * Optional env vars:
 *   VERCEL_ORG_ID           Defaults to this repo's linked team (read from
 *                           .vercel/project.json) so new client projects land
 *                           in the same Vercel team as the existing ones.
 *   SUPABASE_REGION         Defaults to "us-east-1".
 *
 * Deliberately does NOT touch this repo's own .vercel/project.json (which
 * links it to the existing "ai-bos-crm" project) — every Vercel CLI call
 * below passes VERCEL_ORG_ID/VERCEL_PROJECT_ID explicitly instead of relying
 * on that link file, so running this script never repoints the current
 * deployment. Verify `git status`/`.vercel/project.json` are unchanged after
 * a run as a cheap sanity check.
 *
 * What this script does NOT automate (see docs/provisioning-runbook.md):
 *   - First-time `vercel login` / Supabase account access for this machine
 *   - ANTHROPIC_API_KEY, FACEBOOK_APP_ID/SECRET, RESEND_API_KEY — these are
 *     per-client secrets the business owner supplies during onboarding, not
 *     something to generate or guess. The script sets placeholders and the
 *     new client fills in the real ones via the app once it can log in.
 *   - Custom domain purchase/DNS.
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const SUPABASE_API = "https://api.supabase.com/v1";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var ${name}`);
    process.exit(1);
  }
  return value;
}

function parseArgs(): { name: string } {
  const nameIndex = process.argv.indexOf("--name");
  const name = nameIndex !== -1 ? process.argv[nameIndex + 1] : undefined;
  if (!name) {
    console.error('Usage: npx tsx scripts/provision-client.ts --name "Client Business Name"');
    process.exit(1);
  }
  return { name };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readLinkedVercelOrgId(): string {
  const linkPath = path.join(process.cwd(), ".vercel", "project.json");
  try {
    const link = JSON.parse(readFileSync(linkPath, "utf8"));
    return link.orgId;
  } catch {
    throw new Error(
      `Couldn't read ${linkPath} to infer VERCEL_ORG_ID — set it explicitly as an env var.`
    );
  }
}

async function supabaseRequest<T>(
  accessToken: string,
  method: string,
  pathSuffix: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${SUPABASE_API}${pathSuffix}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(
      `Supabase API ${method} ${pathSuffix} failed (${response.status}): ${await response.text()}`
    );
  }
  return response.json() as Promise<T>;
}

async function createSupabaseProject(params: {
  accessToken: string;
  orgId: string;
  name: string;
  region: string;
  dbPassword: string;
}): Promise<{ id: string; ref: string }> {
  console.log(`Creating Supabase project "${params.name}"...`);
  const project = await supabaseRequest<{ id: string; ref: string }>(
    params.accessToken,
    "POST",
    "/projects",
    {
      organization_id: params.orgId,
      name: params.name,
      region: params.region,
      db_pass: params.dbPassword,
      plan: "free",
    }
  );
  return project;
}

async function waitForProjectReady(accessToken: string, ref: string): Promise<void> {
  console.log("Waiting for the database to finish provisioning (this takes a minute or two)...");
  for (let attempt = 0; attempt < 40; attempt++) {
    const project = await supabaseRequest<{ status: string }>(
      accessToken,
      "GET",
      `/projects/${ref}`
    );
    if (project.status === "ACTIVE_HEALTHY") return;
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error("Timed out waiting for the Supabase project to become ready");
}

/**
 * The pooler host's shard number (aws-0-, aws-1-, ...) isn't derivable from
 * the region — it's assigned per-project, so it has to come from the API
 * rather than being guessed from a pattern (confirmed by a failed
 * "tenant/user not found" migration against a guessed host during testing).
 */
async function fetchPoolerConnectionInfo(
  accessToken: string,
  ref: string
): Promise<{ host: string; user: string }> {
  const [pooler] = await supabaseRequest<{ db_host: string; db_user: string }[]>(
    accessToken,
    "GET",
    `/projects/${ref}/config/database/pooler`
  );
  return { host: pooler.db_host, user: pooler.db_user };
}

function buildConnectionStrings(poolerHost: string, poolerUser: string, dbPassword: string) {
  const encodedPassword = encodeURIComponent(dbPassword);
  return {
    databaseUrl: `postgresql://${poolerUser}:${encodedPassword}@${poolerHost}:6543/postgres?pgbouncer=true`,
    directUrl: `postgresql://${poolerUser}:${encodedPassword}@${poolerHost}:5432/postgres`,
  };
}

function runMigrations(directUrl: string) {
  console.log("Applying the Prisma migration history to the new database...");
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DIRECT_URL: directUrl, DATABASE_URL: directUrl },
  });
}

function vercel(args: string[], extraEnv: Record<string, string> = {}, input?: string) {
  return execFileSync("npx", ["vercel", ...args], {
    input,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
  });
}

function createVercelProject(name: string, orgId: string): string {
  console.log(`Creating Vercel project "${name}"...`);
  vercel(["project", "add", name], { VERCEL_ORG_ID: orgId });
  const list = vercel(["project", "ls", "--format", "json"], { VERCEL_ORG_ID: orgId });
  const { projects } = JSON.parse(list) as { projects: { id: string; name: string }[] };
  const project = projects.find((p) => p.name === name);
  if (!project) throw new Error(`Created project "${name}" but couldn't find its id afterward`);
  return project.id;
}

function setVercelEnv(
  key: string,
  value: string,
  orgId: string,
  projectId: string
) {
  vercel(["env", "add", key, "production"], { VERCEL_ORG_ID: orgId, VERCEL_PROJECT_ID: projectId }, value);
}

async function main() {
  const { name } = parseArgs();
  const slug = slugify(name);
  const accessToken = requireEnv("SUPABASE_ACCESS_TOKEN");
  const orgId = requireEnv("SUPABASE_ORG_ID");
  const region = process.env.SUPABASE_REGION ?? "us-east-1";
  const vercelOrgId = process.env.VERCEL_ORG_ID ?? readLinkedVercelOrgId();
  const dbPassword = randomBytes(24).toString("base64url");

  const project = await createSupabaseProject({
    accessToken,
    orgId,
    name: `ai-bos-crm-${slug}`,
    region,
    dbPassword,
  });
  await waitForProjectReady(accessToken, project.ref);

  const poolerInfo = await fetchPoolerConnectionInfo(accessToken, project.ref);
  const { databaseUrl, directUrl } = buildConnectionStrings(
    poolerInfo.host,
    poolerInfo.user,
    dbPassword
  );
  runMigrations(directUrl);

  const vercelProjectName = `ai-bos-crm-${slug}`;
  const vercelProjectId = createVercelProject(vercelProjectName, vercelOrgId);

  console.log("Setting database env vars on the new Vercel project...");
  setVercelEnv("DATABASE_URL", databaseUrl, vercelOrgId, vercelProjectId);
  setVercelEnv("DIRECT_URL", directUrl, vercelOrgId, vercelProjectId);

  console.log("\n✅ Supabase project and Vercel project are ready.");
  console.log(`   Supabase project ref: ${project.ref}`);
  console.log(`   Vercel project: ${vercelProjectName}`);
  console.log("\nRemaining steps (see docs/provisioning-runbook.md):");
  console.log("  1. Deploy: npx vercel deploy --prod --cwd . (with VERCEL_ORG_ID/VERCEL_PROJECT_ID set to the values above)");
  console.log("  2. Have the client open the deployment URL — it will land on /setup");
  console.log("  3. Add ANTHROPIC_API_KEY / FACEBOOK_APP_ID+SECRET / RESEND_API_KEY once the client supplies them");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
