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
4. Nothing else to do here manually: the API creates its own schema on first
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

Once all three pieces are live, do a full walkthrough against the real
deployed URLs (not localhost) to confirm parity with local dev:

- [ ] `GET <render-url>/health` returns `{"status":"ok","db":true}`
- [ ] `<vercel-url>/case-study` renders and its "Open the working chatbot"
      button links to `<vercel-url>/chat`
- [ ] Register a new farmer (phone number, district, crop) via the onboarding
      flow at `<vercel-url>`
- [ ] Send a text message in the chat and get a grounded reply
- [ ] Send a voice message and confirm it transcribes and gets a reply
- [ ] Send a photo and confirm it gets analyzed and gets a reply
- [ ] Confirm `<render-url>/debug/*` is **not reachable** (404 or connection
      refused) — proof `NODE_ENV=production` is actually set
- [ ] Spot-check Render logs for the above requests — confirm no raw phone
      numbers or message text appear, only masked numbers

This checklist is what to run through once you share the live Render/Vercel
URLs back — it hasn't been run yet since deployment happens on your end.
