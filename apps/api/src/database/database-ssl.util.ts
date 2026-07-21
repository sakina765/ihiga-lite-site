import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Logger } from "@nestjs/common";

const logger = new Logger("DatabaseSsl");

// Checked in rather than an env var: every other env var in this project
// (DATABASE_URL, GROQ_API_KEY, ...) is a simple single-line scalar, and a
// multi-line PEM blob would be the first of its kind — fragile to round-trip
// through .env parsing and through a dashboard textarea without a stray
// escaped/missing newline breaking it silently. This certificate is public
// information (Supabase publishes it for every project), so committing it
// costs nothing security-wise and a plain file is both simpler and
// diff-reviewable if it's ever rotated.
const CA_CERT_PATH = join(__dirname, "../../certs/supabase-ca.pem");

let cachedCaCert: string | undefined;
let hasLoggedMissingCert = false;

/**
 * Supabase's Postgres endpoint chains through an intermediate CA that isn't
 * in Node's default trust store — a known, common gap, not an actual problem
 * with Supabase's certificate — which is why `rejectUnauthorized: true`
 * alone fails with "self-signed certificate in certificate chain" even
 * though the connection is legitimate. Handing Node the real CA explicitly
 * fixes this without touching rejectUnauthorized, unlike the tempting (and
 * wrong) workaround of setting it to false — that would accept ANY
 * certificate, including one an attacker presents on the network path to
 * the database, which is the exact vulnerability Phase 10a's SSL hardening
 * closed (see the comment beside rejectUnauthorized in typeorm.config.ts).
 *
 * Returns undefined if the file isn't present yet, so callers degrade to
 * today's `{ rejectUnauthorized: true }` with no `ca` — the existing,
 * safe-but-currently-failing-against-Supabase behavior — instead of crashing
 * NestJS's bootstrap over a missing file.
 */
export function loadDatabaseCaCert(): string | undefined {
  if (cachedCaCert) {
    return cachedCaCert;
  }
  if (!existsSync(CA_CERT_PATH)) {
    if (!hasLoggedMissingCert) {
      logger.warn(
        `Supabase CA certificate not found at ${CA_CERT_PATH} — connecting with rejectUnauthorized: true but no explicit CA. ` +
          'This will fail against Supabase with "self-signed certificate in certificate chain" until the cert is added (see DEPLOYMENT.md).',
      );
      hasLoggedMissingCert = true;
    }
    return undefined;
  }
  cachedCaCert = readFileSync(CA_CERT_PATH, "utf8");
  return cachedCaCert;
}
