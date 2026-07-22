# Deployment

| Piece               | Target   |
| -------------------- | -------- |
| PostgreSQL database  | Supabase |
| `apps/api`           | Render   |
| `apps/web`           | Vercel   |

Deploy in this order — each later piece needs a value produced by the one
before it (the API needs `DATABASE_URL`; the web app needs the API's URL).

## 1. Database → Supabase

1. Create a Supabase project.
2. Project Settings → Database → Connection string. Use the **Session pooler**
   or **direct connection** string (Render runs a long-lived server, not
   serverless functions, so you don't need the transaction pooler). It looks
   like:
   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres
   ```
   This becomes `DATABASE_URL` on the Render service in step 2 — you won't
   need it anywhere else.
3. Supabase requires SSL — set `DATABASE_SSL=true` wherever `DATABASE_URL` is
   used (Render env vars, and locally if you ever point local dev at
   Supabase).
4. **Required alongside `DATABASE_SSL=true`:** download the CA certificate
   from Supabase Dashboard → Project Settings → Database → SSL Configuration,
   and save it as `apps/api/certs/supabase-ca.pem` in this repo (see
   `apps/api/certs/README.md`). Without it, the API fails to connect with
   `self-signed certificate in certificate chain` — Node's default trust
   store doesn't include Supabase's intermediate CA, even though the
   connection itself is legitimate. This certificate is public information
   (Supabase publishes it for every project), so it's safe to commit — this
   is not the same kind of secret as `DATABASE_URL`.
5. Nothing else to do here manually: the API creates its own schema on first
   boot (see below) and the `uuid-ossp` extension Supabase projects ship with
   by default.

Schema management: this project uses TypeORM migrations
(`apps/api/src/database/migrations/`), not `synchronize` — `DATABASE_SYNCHRONIZE`
must stay `false` in any shared environment. The API runs pending migrations
automatically on every boot (`migrationsRun: true` in
`apps/api/src/database/typeorm.config.ts`), so a fresh Supabase database gets
its schema the first time the Render service starts successfully — no manual
migration step required. If you ever need to run migrations by hand (e.g. to
apply one without restarting the service), from `apps/api` locally:

```bash
DATABASE_URL="<supabase connection string>" DATABASE_SSL=true pnpm migration:run
```

Seed data (crop stages + knowledge facts) is not part of migrations — it's
separate, idempotent seed scripts. After the API's first successful boot
against the new database, run once from `apps/api` locally, pointed at
Supabase:

```bash
DATABASE_URL="<supabase connection string>" DATABASE_SSL=true pnpm seed
```

## 2. apps/api → Render

Already deployable as-is:

- Binds to `0.0.0.0` and reads `PORT` from the environment
  (`apps/api/src/main.ts`) — Render sets `PORT` itself, no action needed.
- Build command: `pnpm --filter @ihiga-lite/shared build && pnpm --filter @ihiga-lite/api build`
- Start command: `pnpm --filter @ihiga-lite/api start`
- Health check path: `/health` — set this as the Render service's health
  check path. It returns `{"status":"ok","db":true}` once the database
  connection is initialized.

Environment variables to set on the Render service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The Supabase connection string from step 1 |
| `DATABASE_SSL` | `true` |
| `DATABASE_SYNCHRONIZE` | `false` |
| `NODE_ENV` | `production` — also unmounts `/debug/*` (see below) |
| `FRONTEND_URL` | The deployed Vercel URL, for CORS (fill in after step 3) |
| `GROQ_API_KEY` | From https://console.groq.com → API Keys |
| `AFRICAS_TALKING_API_KEY` | From https://account.africastalking.com |
| `AFRICAS_TALKING_USERNAME` | Your Africa's Talking username (`sandbox` for testing) |

`PORT` is set automatically by Render — do not set it yourself.

`/debug/*` (manual test endpoints for weather/season/crops/knowledge/chat/
notifications, used during earlier phases) is only mounted when
`NODE_ENV !== "production"` — `AppModule` excludes `DebugModule` from its
imports entirely in production, so the routes never get registered. Setting
`NODE_ENV=production` on Render is what makes this take effect.

If Africa's Talking credentials are left blank, `SmsService.sendSms()` logs a
masked-number skip notice and returns without sending — it never throws, so
notifications simply won't go out rather than crashing the service.

## SMS Notifications — Current Status

**What works today:** The daily scheduled job (`@Cron`, in the notifications
module) checks every farmer with an active tracked crop. For each one, it
detects whether their crop just entered a new growth stage, or whether the
weather forecast for their location shows a real risk (heavy rain, etc.) —
and if either is true and hasn't already been notified, composes a short SMS
in the farmer's preferred language and calls `SmsService.sendSms()`. This
entire pipeline — detection, suppression of repeat alerts, message
composition, and the actual API call — is fully built and tested.

**What "Success" currently means, precisely:** The app is configured with
Africa's Talking **sandbox** credentials. A "Success" response from the API
(including a real cost line item in RWF) confirms the integration itself
works correctly end-to-end — but it does **not** confirm real SMS delivery
to a real phone. Africa's Talking's sandbox environment only reliably
delivers to Airtel Kenya test numbers, regardless of the app's actual target
country. In practice, this means: for a real Rwandan farmer using this app
today, the server will log a successful send, but no SMS will actually
arrive on their phone.

**Why real Rwandan delivery isn't live:** Sending real, branded SMS in
Rwanda (or most African markets) requires an approved Sender ID/Alphanumeric
registration, which itself requires proof of an actual registered business:
a Tax ID number, a Certificate of Incorporation, and an authorized
representative's identification. This is a standard industry/regulatory
requirement (not specific to Africa's Talking) designed to prevent anonymous
or spam SMS senders. As a personal/portfolio project without a registered
company, this application cannot currently be completed.

**What going live would actually require (no code changes needed):**

1. Registering Ihiga Lite as a real, legally registered business
2. Submitting Africa's Talking's Sender ID application with real business
   documents
3. Waiting for approval (typically a few business days)
4. Swapping `AFRICAS_TALKING_API_KEY` and `AFRICAS_TALKING_USERNAME` in
   `.env` from sandbox values to the new live app's credentials —
   `SmsService` already reads these from environment variables, so no code
   changes are needed once real credentials exist

**Current safe-degradation behavior:** `SmsService` gracefully logs and
skips if credentials are missing/placeholder, and logs failures without
crashing the batch job if a real send fails — this was built and tested in
Phase 5 and reinforced in later hardening passes. It is safe to run this app
indefinitely in its current sandbox state without anything breaking; the
only consequence is that SMS alerts silently don't reach real phones while
appearing to succeed in logs.

## 3. apps/web → Vercel

This is a pnpm workspace monorepo, and `apps/web` depends on the
`@ihiga-lite/shared` package being built first (it resolves to
`packages/shared/dist/`, not the TypeScript source). In the Vercel project
settings:

- **Root Directory**: `apps/web`
- Enable **"Include files outside the Root Directory in the Build Step"**
  (needed so the build can reach `packages/shared`)
- **Build Command** (override the default):
  ```
  cd ../.. && pnpm --filter @ihiga-lite/shared build && pnpm --filter @ihiga-lite/web build
  ```
- **Install Command**: leave as the default (Vercel detects the root
  `pnpm-lock.yaml` and runs `pnpm install` for the whole workspace)
- **Output Directory**: leave as the default (`.next`, relative to Root
  Directory)

Environment variables to set on the Vercel project:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The deployed Render API URL from step 2 |

After the first deploy, go back to the Render service and set `FRONTEND_URL`
to this Vercel URL (needed for CORS), then redeploy the API.

## 4. Post-deploy verification

**Live URLs:**

| Piece | URL |
| --- | --- |
| `apps/api` (Render) | https://ihiga-lite-site.onrender.com |
| `apps/web` (Vercel) | https://ihiga-lite.vercel.app |

Once all three pieces are live, do a full walkthrough against the real
deployed URLs (not localhost) to confirm parity with local dev:

- [ ] `GET https://ihiga-lite-site.onrender.com/health` returns `{"status":"ok","db":true}`
- [ ] `https://ihiga-lite.vercel.app/case-study` renders and its "Open the
      working chatbot" button links to `https://ihiga-lite.vercel.app/chat`
- [ ] Register a new farmer (phone number, district, crop) via the onboarding
      flow at `https://ihiga-lite.vercel.app`
- [ ] Send a text message in the chat and get a grounded reply
- [ ] Send a voice message and confirm it transcribes and gets a reply
- [ ] Send a photo and confirm it gets analyzed and gets a reply
- [ ] Confirm `https://ihiga-lite-site.onrender.com/debug/*` is **not
      reachable** (404 or connection refused) — proof `NODE_ENV=production`
      is actually set
- [ ] Spot-check Render logs for the above requests — confirm no raw phone
      numbers or message text appear, only masked numbers
