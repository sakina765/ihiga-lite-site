# Ihiga Lite

A crop advisory chatbot for Rwandan farmers.

This is a pnpm workspace monorepo. **Phase 0** covered scaffolding only. **Phase
1** added the season engine, crop lifecycle engine, and knowledge base as pure
data + logic. **Phase 2** adds the chat orchestrator: language detection,
conversation persistence, and real Gemini calls that answer only from the
season/crop/knowledge context the orchestrator gathers — never from the
model's own memory.

## Layout

```
apps/
  api/       NestJS backend (PostgreSQL + TypeORM, Gemini + Africa's Talking stubs)
  web/       Next.js 14 (App Router) frontend
packages/
  shared/    Shared TypeScript types used by both apps (e.g. HealthCheckResponse)
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`corepack enable` will pick up the version pinned in `package.json`)
- A PostgreSQL database (local, or a free Supabase project) for `apps/api`

## Install

```
pnpm install
```

## Environment setup

Each app reads its config from a local `.env` file. Create them from the
provided examples before running anything:

```
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Fill in `apps/api/.env` with your `DATABASE_URL` (see `DEPLOYMENT.md` for the
Supabase-compatible options) and a real `GEMINI_API_KEY` (from
[Google AI Studio](https://aistudio.google.com/apikey)) — `/chat/message` and
`/debug/chat/message` need it to make real Gemini calls. The Africa's Talking
keys can stay blank — that integration is still stubbed. Set
`DATABASE_SYNCHRONIZE=true` locally so TypeORM creates the tables for you (never
do this against a shared/production database).

## Seed data

Populates the `crops`, `crop_stages`, and `knowledge_facts` tables with
placeholder data for maize, beans, and Irish potato:

```
pnpm --filter @ihiga-lite/api seed
```

(or `seed:crops` / `seed:knowledge` individually — crops must be seeded first,
since knowledge facts link to crops by slug).

## Run in development

```
pnpm dev
```

This builds `packages/shared` once, then runs `apps/api` (http://localhost:3001)
and `apps/web` (http://localhost:3000) in parallel. Open the web app — it calls
`GET /health` on the API and shows the connection + database status, proving
the frontend, backend, and shared package all resolve correctly across the
workspace.

## Build

```
pnpm build
```

Builds `packages/shared` first, then `apps/api` and `apps/web`.

## Lint

```
pnpm lint
```

## Test

```
pnpm --filter @ihiga-lite/api test
```

## Chat API

`POST /chat/message` is the real entry point — orchestrates language
detection, season/crop-stage/knowledge context gathering, a Gemini call, and
conversation persistence:

```json
{
  "conversationId": "optional — omit to start a new conversation",
  "message": "What should I do for my maize now?",
  "cropId": "optional — a crop's id, from GET /debug/crops/:slug/stage",
  "plantingDate": "optional — YYYY-MM-DD",
  "language": "optional — 'en' | 'rw' | 'fr', overrides auto-detection"
}
```

Once a conversation exists, `cropId`/`plantingDate`/`language` are remembered
on it — later turns in the same `conversationId` don't need to repeat them.

## Manual verification (temporary)

`apps/api` has a temporary `/debug` controller (see the comments in
`apps/api/src/debug/`) for manually exercising these services without a real
client. **Remove or protect this before production.**

- `GET /debug/season?date=YYYY-MM-DD`
- `GET /debug/crops/:slug/stage?plantingDate=YYYY-MM-DD`
- `GET /debug/knowledge/search?q=...&cropId=...&topic=...`
- `POST /debug/chat/message` — same body as `POST /chat/message` above; hits
  the real orchestrator end-to-end, including a real Gemini API call.

## Other useful commands

Run a script in a single workspace package, e.g.:

```
pnpm --filter @ihiga-lite/api dev
pnpm --filter @ihiga-lite/web dev
```

See `DEPLOYMENT.md` for how each app is deployed.
