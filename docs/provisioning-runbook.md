# Provisioning a new client deployment

`scripts/provision-client.ts` automates the Supabase project + Vercel project
creation and wires the database connection. This doc covers the one-time
setup for this machine, and the manual steps the script doesn't (and
shouldn't) automate.

## One-time setup (per machine, not per client)

1. **Supabase personal access token** — go to
   [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens),
   create a token, export it:
   ```sh
   export SUPABASE_ACCESS_TOKEN=sbp_...
   ```
2. **Supabase organization ID** — find it at
   [supabase.com/dashboard/org/_/general](https://supabase.com/dashboard/org/_/general)
   (or `GET https://api.supabase.com/v1/organizations` with the token above),
   then:
   ```sh
   export SUPABASE_ORG_ID=...
   ```
3. **Vercel CLI login** — `npx vercel login` once if `npx vercel whoami`
   doesn't already show you logged in.

## ⚠️ Cost ceiling: Supabase free tier caps 2 active projects per org

Confirmed by testing: a Supabase organization on the free plan can only have
**2 active free projects** at once, org-wide — not per-user. With the
existing production project already counted, **only 1 more client can be
provisioned free** under the current "Espedro" org before every additional
client requires either upgrading that org to a paid Supabase plan (billed
per-project beyond the free allowance) or creating a separate Supabase
account/org per client (more manual, harder to manage centrally). Factor
this into client pricing before signing client #2 — the free tier doesn't
scale past one paying customer.

## Provisioning a new client

```sh
npx tsx scripts/provision-client.ts --name "New Client Business Name"
```

This creates a new Supabase project, applies every Prisma migration to it,
creates a matching Vercel project under the same team, and sets
`DATABASE_URL`/`DIRECT_URL`. It prints the exact next command to deploy.

**Safety note:** the script never touches this repo's own `.vercel/project.json`
(which links your local checkout to the existing production project) — it
passes `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` explicitly to every Vercel CLI call
instead. After running it, a quick `git status` should show
`.vercel/project.json` untouched — treat any diff there as a bug to fix
before deploying anything.

## Steps the script does NOT automate (do these manually)

1. **Deploy the new project**, using the org/project IDs the script printed:
   ```sh
   VERCEL_ORG_ID=<printed> VERCEL_PROJECT_ID=<printed> npx vercel deploy --prod
   ```
2. **Point the client at their new URL.** It will redirect to `/setup` until
   they complete onboarding (business profile, first team member) — this
   part is already fully self-serve, no dev work needed.
3. **Add the client's own API keys** once they have them, via
   `npx vercel env add <KEY> production` with `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`
   set to their project:
   - `ANTHROPIC_API_KEY` — the client (or you, if reselling) funds an
     Anthropic Console account.
   - `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` — **reuse the existing shared
     "AI BOS CRM" Meta app** rather than creating a new one per client; the
     OAuth connect flow (`/api/auth/facebook/connect`) already handles
     onboarding a new client's own Page under that one app.
   - `RESEND_API_KEY` — either the client's own Resend account (if they want
     to verify their own sending domain) or a shared one you manage, set via
     `NEXT_PUBLIC_FACEBOOK_APP_ID` / the `BusinessProfile.emailFromAddress`
     settings in `/settings/channels` once they've verified a domain.
4. **Custom domain** (optional) — purchase/point DNS, add it in the Vercel
   project's Domains settings. Not scripted since it varies per client and
   often isn't needed on day one (the `*.vercel.app` URL works fine to start).

## Troubleshooting

- If `prisma migrate deploy` fails partway through, the new Supabase project
  is safe to delete and recreate — nothing else depends on it yet at that
  point.
- If the Vercel project was created but you want to start over, delete it
  from the Vercel dashboard before re-running the script (it doesn't
  currently check for an existing project with the same name).
