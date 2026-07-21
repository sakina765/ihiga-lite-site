import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { loadDatabaseCaCert } from "./database-ssl.util";

// Standalone DataSource for the TypeORM CLI (migration:generate/run/revert).
// Separate from database/typeorm.config.ts, which builds the options object
// NestJS uses at runtime via ConfigService — the CLI runs outside Nest's
// bootstrap, so it needs its own env loading and an explicit entities glob
// instead of Nest's autoLoadEntities.
config();

const useSsl = process.env.DATABASE_SSL === "true";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  // See the matching comment in typeorm.config.ts — validates the server
  // certificate against the trusted CA bundle rather than accepting any
  // cert, using Supabase's actual CA (see database-ssl.util.ts) since
  // Node's default trust store doesn't include it.
  ssl: useSsl ? { rejectUnauthorized: true, ca: loadDatabaseCaCert() } : false,
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});
