# 🌱 Ihiga Lite

**AI-powered crop advisory chat for Rwandan farmers.**

Ihiga Lite is a season-aware, crop-stage-aware chatbot that gives smallholder farmers in Rwanda honest, grounded agricultural advice — by text, voice 🎙️, or photo 📸 — in whichever language they're most comfortable with: English, Kinyarwanda, or French.

It's a pnpm monorepo: a NestJS API talking to Groq's Llama models, and a Next.js frontend with a fully localized marketing site and chat experience.

---

## ✨ Features

- 🌦️ **Season & weather-aware advice** — grounded in Rwanda's real Season A/B/C calendar and live weather (Open-Meteo), never a generic guess
- 🌾 **Crop-stage tracking** — knows what week a farmer is in, from planting to harvest, for whatever crop they mention
- 💬 **Multi-modal chat** — text, voice (transcribed via Groq Whisper), and photo (read by a vision model, with an explicit hedging policy — a wrong confident pest/disease call could hurt a real harvest)
- 🗣️ **Fully localized, not just the chat** — the homepage, onboarding, chat chrome, and sidebar all work in English, Kinyarwanda, and French, and a farmer's chosen language becomes the authoritative override for every AI reply, not just a per-message guess
- 📍 **Location-aware** — a cascading province → district → sector → village picker, plus a one-tap GPS shortcut, for farm-exact weather
- 🌱 **Season-aware crop suggestions** — sidebar recommendations based on a farmer's province and the current season
- 📲 **Proactive SMS alerts** — a daily job (Africa's Talking) texts farmers when their crop reaches a new stage or the weather turns risky for fieldwork
- 🧠 **Honest by design** — the system prompt is built to flag general vs. locally-verified guidance, and to say "I don't know" rather than hallucinate specifics
- 🎨 **A real marketing homepage** — animated intro, hero, feature grid, an animated "how it works" walkthrough, and a photo-collage trust section, not just a bare chat window

---

## 🛠️ Tech stack

**Frontend** — `apps/web`
- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Motion](https://motion.dev/) (the Framer Motion successor) for animation
- A lightweight custom i18n layer — React Context + flat JSON dictionaries, deliberately not a heavy i18n library, to keep the bundle light for low-end Android
- Jest + React Testing Library

**Backend** — `apps/api`
- [NestJS](https://nestjs.com/) + TypeScript
- PostgreSQL + TypeORM
- [Groq](https://groq.com/) — Llama models for chat, Whisper for voice, a vision model for photos — via the OpenAI-compatible SDK
- [Africa's Talking](https://africastalking.com/) for SMS
- [Open-Meteo](https://open-meteo.com/) for weather (no API key required)
- Nominatim/OpenStreetMap for village-level geocoding
- `class-validator` / `class-transformer` for request validation
- `@nestjs/throttler` for rate limiting, `@nestjs/schedule` for the daily SMS cron
- Jest + Supertest

**Shared**
- `packages/shared` — TypeScript types shared between both apps, so the API and frontend never silently drift apart on shapes

**Infra**
- pnpm workspaces monorepo
- Deploys: Supabase (Postgres) → Render (`apps/api`) → Vercel (`apps/web`) — see [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## 📁 Project layout

```
apps/
  api/       NestJS backend — chat orchestration, Groq, weather, SMS, farmers, crops, language resolution
  web/       Next.js 14 (App Router) frontend — marketing site + chat UI, fully localized (EN/RW/FR)
packages/
  shared/    Shared TypeScript types used by both apps
```

`apps/api/src`: `ai` (Groq client), `chat` (orchestration), `crops`, `farmers`, `knowledge`, `language`, `location`, `notifications`, `season`, `weather`, `common`, `debug`, `health`.

`apps/web/src`: `app` (routes), `components/home`, `components/chat` (+ `sidebar`), `components/onboarding`, `components/ui`, `i18n` (dictionaries + provider), `lib` (API clients).

---

## ⚙️ Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`corepack enable` picks up the version pinned in `package.json` automatically)
- A PostgreSQL database (local, or a free [Supabase](https://supabase.com/) project)

---

## 🚀 Getting started

### 1. Install

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Fill in `apps/api/.env` with:

- `DATABASE_URL` — your Postgres connection string (see `DEPLOYMENT.md` for the Supabase-specific setup)
- `GROQ_API_KEY` — free from [console.groq.com](https://console.groq.com) → API Keys — every real chat/voice/photo reply needs it
- `AFRICAS_TALKING_*` — can stay blank; SMS sending degrades gracefully without them, it just logs and skips

Set `DATABASE_SYNCHRONIZE=true` locally so TypeORM creates the tables for you. ⚠️ Never enable this against a shared or production database.

### 3. Seed reference data

```bash
pnpm --filter @ihiga-lite/api seed
```

Populates crops, crop stages, knowledge facts, and Rwanda's sectors. (Or run `seed:crops` / `seed:knowledge` / `seed:sectors` individually — crops must be seeded first, since knowledge facts and stages link to them.)

### 4. Run in development

```bash
pnpm dev
```

Builds `packages/shared` once, then runs both apps in parallel:

- 🖥️ **apps/web** → http://localhost:3000 — the homepage and `/chat`
- 🔌 **apps/api** → http://localhost:3001 — the API

> 💡 Even Groq's generous free tier has per-minute and per-day rate limits. If `/chat` starts returning the generic "having trouble answering" reply for every message, check the API logs before assuming it's a bug — `GroqService` logs the real cause (429 rate limit, network error, etc.).

---

## 🌍 Internationalization

Every screen — homepage, onboarding, chat chrome, sidebar — works in **English, Kinyarwanda, and French**:

- A persistent language switcher (homepage header/footer, chat header) re-renders the entire UI instantly, no reload needed
- Onboarding includes an explicit language step, pre-filled from whatever was already chosen
- Once a farmer picks a language, it's stored as `Farmer.preferredLanguage` and becomes the **authoritative override** for every Groq reply — replies stay consistent with the farmer's choice instead of a per-message auto-detection guess
- Dictionaries live in `apps/web/src/i18n/dictionaries/{en,rw,fr}.json`; a key missing from the current language falls back to English (never a blank string or a raw key name) and logs a dev warning so gaps get caught during testing, not silently

---

## 💬 Chat API

`POST /chat/message` is the core endpoint — it resolves the farmer's language, gathers season/crop-stage/knowledge/weather context, calls Groq, and persists the conversation:

```json
{
  "conversationId": "optional — omit to start a new conversation",
  "farmerId": "required — from POST /farmers/register",
  "message": "What should I do for my maize now?",
  "cropId": "optional",
  "plantingDate": "optional — YYYY-MM-DD",
  "language": "optional — 'en' | 'rw' | 'fr', a one-message override on top of the farmer's stored preference"
}
```

- **`POST /chat/voice`** (multipart, field `audio`, ≤10MB, webm/ogg/wav/mp4/mpeg/m4a) — transcribes via Groq Whisper, then runs the same flow as above; the response includes `transcribedText` (what Whisper heard).
- **`POST /chat/photo`** (multipart, field `image`, ≤8MB, JPEG/PNG/WebP, optional `caption` field) — sends the photo to Groq's vision model for a hedged plant-health read, grounded with the same season/crop/knowledge context.

Every `Message` row records which input modality produced it (`text` | `voice` | `photo`) — bot replies are always `text`.

---

## 🧑‍🌾 Farmers, location & weather

- `POST /farmers/register` — idempotent by phone number (normalizes common Rwandan formats to `+2507XXXXXXXX`)
- `PATCH /farmers/:id/language` / `GET /farmers/:id/language` — sync a farmer's chosen UI language
- `GET /location/sectors`, `GET /location/nearest-sector`, `POST /location/resolve-village` — power the cascading province → district → sector → village picker, plus the GPS shortcut
- Weather (Open-Meteo, no API key) is looked up by district and injected as grounding context — e.g. "22% chance of rain today" can reasonably back up an irrigation suggestion

---

## 📲 Notifications

A daily cron job (`NotificationSchedulerService`) texts a farmer via Africa's Talking when either their crop has reached a new stage, or the weather makes today a bad day to work the soil — each condition fires at most once per day per farmer, so nobody gets spammed.

---

## 🧪 Testing, building & linting

```bash
pnpm build                              # builds packages/shared, then both apps
pnpm lint                               # type-checks both apps + shared
pnpm --filter @ihiga-lite/api test      # backend test suite (Jest)
pnpm --filter @ihiga-lite/web test      # frontend test suite (Jest + Testing Library)
```

---

## 🔍 Manual verification (debug endpoints)

`apps/api` has a temporary `/debug` controller for exercising services without a real client. **Remove or protect this before production.**

- `GET /debug/season?date=YYYY-MM-DD`
- `GET /debug/crops/:slug/stage?plantingDate=YYYY-MM-DD`
- `GET /debug/knowledge/search?q=...&cropId=...&topic=...`
- `GET /debug/weather?district=Musanze` — hits the real Open-Meteo API
- `POST /debug/chat/message` — same body as `POST /chat/message`; hits the real orchestrator end-to-end, including a real Groq call
- `POST /debug/notifications/run` — runs the daily SMS job immediately, without waiting for the schedule

---

## 📦 Other useful commands

Run a script in a single workspace package, e.g.:

```bash
pnpm --filter @ihiga-lite/api dev
pnpm --filter @ihiga-lite/web dev
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for how each piece is deployed.

---

Built with 🌿 for Rwandan farmers.
