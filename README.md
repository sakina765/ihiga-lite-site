# 🌱 Ihiga Lite

**AI-powered crop advisory chat for Rwandan farmers.**

Ihiga Lite is a season-aware, crop-stage-aware chatbot that gives smallholder farmers in Rwanda honest, grounded agricultural advice — by text, voice 🎙️, or photo 📸 — in whichever language they're most comfortable with: English, Kinyarwanda, or French.

It's a pnpm monorepo: a NestJS API talking to Groq's Llama models, and a Next.js frontend with a fully localized marketing site and chat experience.

---

## ✨ Features

- 🌦️ **Season & weather-aware advice** — grounded in Rwanda's real Season A/B/C calendar and live weather (Open-Meteo), never a generic guess
- 🌾 **Crop-stage tracking** — knows what week a farmer is in, from planting to harvest, for whatever crop they mention, and carries it forward into new conversations automatically
- 💬 **Multi-modal chat** — text, voice (transcribed via Groq Whisper), and photo (read by a vision model, with an explicit hedging policy — a wrong confident pest/disease call could hurt a real harvest)
- 💾 **Persistent conversations** — refreshing the page or navigating away and back to `/chat` resumes exactly where you left off, not a blank slate
- 🗑️ **Delete conversation, anytime** — a one-tap, confirm-first way to clear chat history without losing a tracked crop or language preference
- 📤 **Share your chat via WhatsApp, as a PDF** — generates a branded, paginated transcript client-side and hands it to the OS share sheet (or falls back to a real download + WhatsApp prefill on desktop)
- 🗣️ **Fully localized, not just the chat** — the homepage, onboarding, chat chrome, and sidebar all work in English, Kinyarwanda, and French, and a farmer's chosen language becomes the authoritative override for every AI reply, not just a per-message guess
- 📍 **Location-aware** — a cascading province → district → sector → village picker, plus a one-tap GPS shortcut, for farm-exact weather
- 🌱 **Season-aware crop suggestions** — sidebar recommendations based on a farmer's province and the current season
- 📲 **Proactive SMS alerts** — a daily job (Africa's Talking) detects a new crop stage or risky weather and composes/sends an SMS in the farmer's language; the full pipeline is built and tested, though real Rwandan delivery isn't live yet — see the Notifications section below
- 🧠 **Honest by design** — the system prompt flags general vs. locally-verified guidance instead of hallucinating specifics, and is explicit about *why* a data point is missing (no district shared yet, vs. district known but a lookup failed) so it never falsely implies it doesn't know the current season or a farmer's location
- 🎨 **A real marketing homepage** — animated intro, hero photo carousel, feature grid, an animated "how it works" walkthrough, and a photo-collage trust section, not just a bare chat window

---

## 🛠️ Tech stack

**Frontend** — `apps/web`
- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Motion](https://motion.dev/) (the Framer Motion successor) for animation
- [jsPDF](https://github.com/parallax/jsPDF) for the client-side chat-transcript PDF export, plus the Web Share API (with a download + `wa.me` fallback) for the WhatsApp share flow
- A lightweight custom i18n layer — React Context + flat JSON dictionaries, deliberately not a heavy i18n library, to keep the bundle light for low-end Android
- Jest + React Testing Library

**Backend** — `apps/api`
- [NestJS](https://nestjs.com/) + TypeScript
- PostgreSQL + TypeORM (schema changes ship as versioned migrations — see [`apps/api/src/database`](./apps/api/src/database))
- [Groq](https://groq.com/) — Llama models for chat, Whisper for voice, a vision model for photos — via the OpenAI-compatible SDK
- [Africa's Talking](https://africastalking.com/) for SMS
- [Open-Meteo](https://open-meteo.com/) for weather (no API key required)
- Nominatim/OpenStreetMap for village-level geocoding
- `class-validator` / `class-transformer` for request validation
- `@nestjs/throttler` for rate limiting, `@nestjs/schedule` for the daily SMS cron
- `@nestjs/jwt` + `cookie-parser` + `bcryptjs` for admin session auth (see the Admin panel section below)
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
  api/       NestJS backend — chat orchestration, Groq, weather, SMS, farmers, crops, language resolution, admin panel API
  web/       Next.js 14 (App Router) frontend — marketing site + chat UI + admin panel, fully localized (EN/RW/FR)
packages/
  shared/    Shared TypeScript types used by both apps
```

`apps/api/src`: `ai` (Groq client), `auth` (admin login/session), `chat` (orchestration), `crops`, `database` (TypeORM migrations), `farmers`, `knowledge`, `language`, `location`, `notifications`, `season`, `weather`, `common`, `debug`, `health`.

`apps/web/src`: `app` (routes, including `app/admin`), `components/home`, `components/chat` (+ `sidebar`), `components/onboarding`, `components/admin`, `components/ui`, `i18n` (dictionaries + provider), `lib` (API clients).

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
- **`GET /chat/:id?farmerId=...`** — fetches a conversation's full message history in order; powers resuming a chat after a refresh or navigating away and back. Scoped by `farmerId`, not just the conversation id — a mismatch 404s identically to "doesn't exist," so one farmer can't probe another's conversation ids.
- **`DELETE /chat/:id?farmerId=...`** — clears a conversation's messages (same ownership check as above). Deliberately leaves the `Conversation` row itself intact, since that's also where the tracked crop and resolved language live — clearing chat history never silently un-tracks a farmer's crop.

Every `Message` row records which input modality produced it (`text` | `voice` | `photo`) — bot replies are always `text`.

The chat page's overflow menu (kebab icon, next to the language switcher) exposes both of these to the farmer directly: **delete conversation** (confirm-first, since it's destructive) and **share via WhatsApp as a PDF** — a branded, paginated transcript built client-side with jsPDF, handed to the native OS share sheet where supported, or downloaded for real with a WhatsApp prefill as a fallback (WhatsApp's web link has no way to auto-attach a file, so the fallback is honest about the two-step handoff instead of pretending otherwise).

---

## 🧑‍🌾 Farmers, location & weather

- `POST /farmers/register` — idempotent by phone number (normalizes common Rwandan formats to `+2507XXXXXXXX`)
- `PATCH /farmers/:id/language` / `GET /farmers/:id/language` — sync a farmer's chosen UI language. Both always return 200 with the same response shape whether or not the id is real — there's no companion credential to check ownership against here, so a distinguishable 404 would let a caller enumerate which farmerIds actually exist
- `GET /location/sectors`, `GET /location/nearest-sector`, `POST /location/resolve-village` — power the cascading province → district → sector → village picker, plus the GPS shortcut
- Weather (Open-Meteo, no API key) is looked up by district and injected as grounding context — e.g. "22% chance of rain today" can reasonably back up an irrigation suggestion

---

## 📲 Notifications

A daily cron job (`NotificationSchedulerService`) texts a farmer via Africa's Talking when either their crop has reached a new stage, or the weather makes today a bad day to work the soil — each condition fires at most once per day per farmer, so nobody gets spammed. Detection, repeat-alert suppression, message composition, and the send itself are all built and tested.

⚠️ **Sandbox only, currently.** Africa's Talking's sandbox environment reliably delivers only to Airtel Kenya test numbers — a "Success" response (with a real cost line item) confirms the integration works, not that a real Rwandan farmer's phone receives anything. Going live needs an Africa's Talking Sender ID, which itself needs a registered business (Tax ID, Certificate of Incorporation, rep ID) — not a code change; swapping the sandbox `AFRICAS_TALKING_*` credentials for live ones is the entire remaining step once that's in place. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full picture.

---

## 🛠️ Admin panel

An internal-only panel at `/admin` (same Next.js app, same NestJS API — no separate deployment) for staff to manage the data the chatbot is grounded on and to keep an eye on real usage:

- 📚 **Knowledge base** — create, edit, and review the facts the chatbot cites, per crop/topic
- 🌱 **Crops & stages** — manage the crop catalog and each crop's week-by-week stage timeline
- 📅 **Seasons** — edit Rwanda's Season A/B/C boundary dates
- 🧑‍🌾 **Farmers** — a searchable, paginated read-only view of real farmer records (phone numbers masked by default), plus deactivate/reactivate
- 💬 **Conversations** — read any farmer's conversation transcript, and flag individual messages for follow-up
- 📨 **Alerts log** — every SMS the daily job has actually sent or attempted, with the real Africa's Talking delivery status
- 📍 **Regions** — manage sectors (create/edit/delete) within Rwanda's location hierarchy

It's mobile-responsive (a slide-in drawer nav + card layouts replace the desktop tables below `md`), but it's an internal tool, not a public-facing surface — there's no sign-up, and accounts are provisioned by hand:

```bash
pnpm --filter @ihiga-lite/api promote-to-admin "+250788000000" "a-strong-password"
```

This promotes an existing farmer row (or creates one) to `role = "admin"` with a bcrypt-hashed password. Admins sign in with that phone number + password at `/admin/login`; the API issues a JWT in an `httpOnly` cookie (`sameSite=lax` locally, `sameSite=none; secure` in production, since the deployed frontend and API are on different sites), which every `/admin/*` request then carries automatically.

---

## 🔒 Security

A defense-in-depth pass hardened the surfaces most exposed to real traffic:

- **Conversation ownership enforcement** — every entry point that accepts a client-supplied `conversationId` (chat turns, history reads, deletes, the pending crop-tracking confirm/decline flow) checks it against the caller's `farmerId` through one shared invariant, so knowing a conversation id alone is never enough to read or act on someone else's chat
- **Prompt-injection resistant grounding** — a farmer's raw message is explicitly delimited from the server-built CONTEXT block sent to Groq, with the system prompt instructed to never treat text after that marker as an additional verified fact, no matter how it's formatted
- **Anti-enumeration by design** — farmer-lookup endpoints return the same response shape for a real vs. nonexistent id, the same principle already used for conversation lookups
- **Rate limiting that survives sitting behind a reverse proxy** — `trust proxy` is scoped to exactly Render's one hop, so per-client throttling keys on the real caller's address, not the proxy's
- **A real Content-Security-Policy** on the frontend — nonce + `strict-dynamic` (never a blanket `unsafe-inline`), plus X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and HSTS in production — this covers `/admin/*` too, not just the farmer-facing pages
- **Database hardening** — TLS certificate validation is enforced (not just encryption without authentication), `synchronize` is hard-blocked in production regardless of env misconfiguration, and a bounded connection pool protects a free-tier Supabase plan from exhaustion
- **Every admin endpoint is guard-gated** — `AdminGuard` verifies the session JWT and its `role` claim on every `/admin/*` route except login itself; a missing, expired, or non-admin token all collapse to the same 403, and the login endpoint has its own tighter rate limit
- `/debug/*` is allowlisted to `NODE_ENV=development` specifically — it fails *closed* on anything else (unset, a typo, a staging env), not just excluded on an exact `"production"` match

**Known limitation, deliberately not solved yet:** regular farmers have no authenticated session — `farmerId` is a self-generated UUID the client holds (in `localStorage`) and passes on every request, not a verified account. That's a scope boundary for this project's current stage, not an oversight; an OTP-verified phone number plus a signed session is the natural next step before this could responsibly handle real farmer data at scale. (This limitation is specific to the farmer-facing chat — the admin panel above already requires a real, verified login.)

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

`apps/api` has a temporary `/debug` controller for exercising services without a real client. It's allowlisted to `NODE_ENV=development` specifically — `AppModule` only mounts `DebugModule` for that exact value, so it's absent for `production`, an unset `NODE_ENV`, a typo, or a staging environment alike, not just excluded on an exact `"production"` match.

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

Database migrations (`apps/api`):

```bash
pnpm --filter @ihiga-lite/api migration:generate src/database/migrations/SomeName
pnpm --filter @ihiga-lite/api migration:run
pnpm --filter @ihiga-lite/api migration:revert
```

Admin account provisioning (`apps/api`):

```bash
pnpm --filter @ihiga-lite/api promote-to-admin "+250788000000" "a-strong-password"
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for how each piece is deployed.

---

Built with 🌿 for Rwandan farmers.
