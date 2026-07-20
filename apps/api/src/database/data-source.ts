import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";

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
  // certificate against the trusted CA bundle rather than accepting any cert.
  ssl: useSsl ? { rejectUnauthorized: true } : false,
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});
