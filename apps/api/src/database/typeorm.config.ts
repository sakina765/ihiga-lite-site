import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { loadDatabaseCaCert } from "./database-ssl.util";

const logger = new Logger("TypeOrmConfig");

// A free-tier Supabase project's direct-connection cap is small (historically
// ~60), and this API sets no per-client auth to bound concurrent load itself
// — a deliberate, modest ceiling here (with headroom under that cap) is
// cheaper than discovering the real limit via a production outage.
const POOL_MAX_CONNECTIONS = 10;

export function buildTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const useSsl = configService.get<string>("DATABASE_SSL") === "true";
  const isProduction = process.env.NODE_ENV === "production";
  const requestedSynchronize = configService.get<string>("DATABASE_SYNCHRONIZE") === "true";

  // Migrations (see database/migrations/) are the actual source of truth for
  // schema changes — DATABASE_SYNCHRONIZE is a local-prototyping convenience
  // only. This is enforced here in code, not just documented in
  // .env.example, so a misconfigured env var on a deploy platform can never
  // silently let synchronize rewrite the production schema. The warning
  // below makes a blocked attempt visible in the logs rather than a silent
  // no-op that could be mistaken for "it just wasn't set".
  if (requestedSynchronize && isProduction) {
    logger.warn(
      "DATABASE_SYNCHRONIZE=true was set with NODE_ENV=production — refusing to enable it. " +
        "Migrations (migrationsRun below) are the only schema-management mechanism allowed in production.",
    );
  }
  const synchronize = requestedSynchronize && !isProduction;

  return {
    type: "postgres",
    url: configService.get<string>("DATABASE_URL"),
    // rejectUnauthorized: true validates the server's certificate against the
    // trusted CA bundle — Supabase's certs chain to a public CA, so this
    // authenticates the connection instead of merely encrypting it (the
    // previous `false` accepted any certificate, including an
    // attacker-presented one on the network path to Supabase). `ca` supplies
    // Supabase's actual CA (see database-ssl.util.ts) since Node's default
    // trust store doesn't include Supabase's intermediate CA — without it,
    // rejectUnauthorized: true fails with "self-signed certificate in
    // certificate chain" even against a legitimate connection.
    ssl: useSsl ? { rejectUnauthorized: true, ca: loadDatabaseCaCert() } : false,
    synchronize,
    migrationsRun: true,
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    autoLoadEntities: true,
    entities: [],
    extra: { max: POOL_MAX_CONNECTIONS },
  };
}
