# Ihiga Lite

A crop advisory chatbot for Rwandan farmers.

This is a pnpm workspace monorepo. **Phase 0** covered scaffolding only. **Phase
1** added the season engine, crop lifecycle engine, and knowledge base as pure
data + logic. **Phase 2** added the chat orchestrator: language detection,
conversation persistence, and real LLM calls that answer only from the
season/crop/knowledge context the orchestrator gathers — never from the
model's own memory. **Phase 3** added the real chat UI at `/chat` in `apps/web`,
wired to the live `POST /chat/message` endpoint (text-only — mic/camera are
present but inactive placeholders for Phase 4). **Phase 3.5** migrated the AI
provider from Gemini to Groq (Llama models) — Gemini's free tier capped out at
20 requests/day on this project, too low to develop against; Groq's free tier
allows roughly 1,000+/day with no card required. **Phase 4** enabled the mic
and camera: `POST /chat/voice` transcribes a recorded clip via Groq's Whisper
endpoint and hands the text to the same orchestrator flow as a typed message;
`POST /chat/photo` sends a plant photo to Groq's vision model (grounded with
the same season/crop/knowledge context, with an explicit honesty/hedging
system prompt — a wrong confident pest/disease call could lead to the wrong
treatment on a real crop). **Phase 5** added farmer identity: a phone-number
onboarding gate in front of the chat UI, live weather (Open-Meteo, no API key)
as a 4th grounding context alongside season/crop/knowledge, and a real daily
SMS notification job (Africa's Talking) for crop-stage changes and weather
risk — replacing the Phase 0 stub.

## Layout

```
apps/
  api/       NestJS backend (PostgreSQL + TypeORM, Groq + Africa's Talking stubs)
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
Supabase-compatible options) and a real `GROQ_API_KEY` (from
[console.groq.com](https://console.groq.com) → API Keys) — `/chat/message` and
`/debug/chat/message` need it to make real Groq calls. The Africa's Talking
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
and `apps/web` (http://localhost:3000) in parallel.

- `/` — the Phase 0 health-check page (calls `GET /health`, shows connection status).
- `/chat` — the real chatbot UI, wired to `POST /chat/message`.

Note: even Groq's generous free tier has request-per-minute and per-day caps
(see `groq.service.ts` for current figures) — if `/chat` starts showing the
generic "Sorry, I'm having trouble answering right now" reply for every
message, you've likely hit a rate limit rather than a bug; `GroqService` logs
the real cause (429 rate limit / network error / etc.) on the API side.

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
detection, season/crop-stage/knowledge context gathering, a Groq call, and
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
`farmerId` is now **required** on every `/chat/*` endpoint — register one
first via `POST /farmers/register`.

`POST /chat/voice` (multipart, field `audio`) transcribes the clip via Groq's
Whisper endpoint, then runs it through the exact same flow as `POST
/chat/message` — the response is the usual shape plus `transcribedText` (what
Whisper heard). Accepts up to 10MB; webm/ogg/wav/mp4/mpeg/m4a.

`POST /chat/photo` (multipart, field `image`, optional `caption` field) sends
the photo to Groq's vision model for a hedged plant-health read, grounded with
whatever season/crop/knowledge context the conversation already has. Accepts
up to 8MB; JPEG/PNG/WebP only.

Every `Message` row now has a `type` (`text` | `voice` | `photo`) recording
which input modality produced it — bot replies are always `text`.

## Farmers & weather

`POST /farmers/register` — `{ phoneNumber, district? }` → `{ farmerId, phoneNumber, district }`.
Idempotent by phone number (normalizes common Rwandan formats — `0788123456`,
`+250788123456`, `788123456`, with spaces/dashes — to `+2507XXXXXXXX`); calling
it twice with the same number returns the same `farmerId` rather than
duplicating. Store the returned `farmerId` client-side (the web app uses
`localStorage`) and send it on every `/chat/*` call.

Weather (Open-Meteo, no API key) is looked up by the farmer's `district` and
wired into the chat orchestrator as a 4th grounding context alongside
season/crop/knowledge — e.g. it can tell Groq "22% chance of rain today" so a
reply can reasonably suggest irrigating. Only a handful of districts have
coordinates configured so far (see `apps/api/src/weather/rwanda-districts.ts`
— Rwanda has 30 total); farmers outside that list just get no weather context,
gracefully, not an error. Responses are cached in-memory for 1 hour per
district.

## Notifications (SMS)

A daily `@Cron` job (`NotificationSchedulerService`, `apps/api/src/notifications/`)
checks each farmer's most recent active crop conversation and sends a short SMS
via Africa's Talking when either: (a) their crop has reached a new stage since
the last notification, or (b) the weather forecast says the soil isn't
workable today and no weather alert has gone out yet today. Each farmer tracks
`lastNotifiedStageId` / `lastNotifiedWeatherAlertDate` so the same alert
doesn't repeat daily.

`SmsService.sendSms()` never throws — missing/placeholder credentials or a
real send failure both log clearly and return normally, so one SMS problem
can't crash the batch job for every other farmer.

## Manual verification (temporary)

`apps/api` has a temporary `/debug` controller (see the comments in
`apps/api/src/debug/`) for manually exercising these services without a real
client. **Remove or protect this before production.**

- `GET /debug/season?date=YYYY-MM-DD`
- `GET /debug/crops/:slug/stage?plantingDate=YYYY-MM-DD`
- `GET /debug/knowledge/search?q=...&cropId=...&topic=...`
- `GET /debug/weather?district=Musanze` — hits the real Open-Meteo API.
- `POST /debug/chat/message` — same body as `POST /chat/message` above (now
  requires `farmerId` too); hits the real orchestrator end-to-end, including a
  real Groq API call.
- `POST /debug/notifications/run` — runs the same logic as the daily `@Cron`
  job immediately, without waiting for the real schedule.

## Other useful commands

Run a script in a single workspace package, e.g.:

```
pnpm --filter @ihiga-lite/api dev
pnpm --filter @ihiga-lite/web dev
```

See `DEPLOYMENT.md` for how each app is deployed.
