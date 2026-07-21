# Supabase CA certificate

Place `supabase-ca.pem` in this directory to fix
`self-signed certificate in certificate chain` errors when connecting to
Supabase with `DATABASE_SSL=true` (see `database-ssl.util.ts` and
`DEPLOYMENT.md` for why this is needed).

Get it from: **Supabase Dashboard → Project Settings → Database → SSL
Configuration → download the CA certificate.**

This certificate is public information — Supabase publishes it for every
project — so it's safe to commit here alongside the code, unlike
`DATABASE_URL`/`GROQ_API_KEY`.
