# Deployment

| Piece                | Target   |
| -------------------- | -------- |
| `apps/api`           | Render   |
| `apps/web`           | Vercel   |
| PostgreSQL database  | Supabase |

## apps/api → Render

Already deployable as-is:

- Binds to `0.0.0.0` and reads `PORT` from the environment (`apps/api/src/main.ts`)
- Build command: `pnpm --filter @ihiga-lite/shared build && pnpm --filter @ihiga-lite/api build`
- Start command: `pnpm --filter @ihiga-lite/api start`

Environment variables to set on the Render service:

- `DATABASE_URL` — Supabase connection string (transaction pooler or direct, depending on plan)
- `DATABASE_SSL` — `true` (Supabase requires SSL)
- `DATABASE_SYNCHRONIZE` — `false` in any shared environment; use migrations instead
- `PORT` — set automatically by Render, no action needed
- `FRONTEND_URL` — the deployed Vercel URL, for CORS
- `GEMINI_API_KEY`
- `AFRICAS_TALKING_API_KEY`
- `AFRICAS_TALKING_USERNAME`

## apps/web → Vercel

Standard Next.js app, no special configuration needed. Set the project root
to `apps/web` when importing the repo into Vercel.

Environment variables to set on the Vercel project:

- `NEXT_PUBLIC_API_URL` — the deployed Render API URL

## Database → Supabase

Create a Supabase project and use its connection string as `DATABASE_URL` for
the API service (both locally and on Render). Supabase requires
`DATABASE_SSL=true`.
