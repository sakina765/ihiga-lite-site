import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function buildTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const useSsl = configService.get<string>("DATABASE_SSL") === "true";

  return {
    type: "postgres",
    url: configService.get<string>("DATABASE_URL"),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    // Migrations (see database/migrations/) are the source of truth for schema
    // changes. synchronize defaults to false and should stay off outside local
    // prototyping — see DATABASE_SYNCHRONIZE in .env.example. migrationsRun
    // applies any pending migrations on boot, so a fresh Render/Supabase
    // database gets its schema without a separate manual step.
    synchronize: configService.get<string>("DATABASE_SYNCHRONIZE") === "true",
    migrationsRun: true,
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    autoLoadEntities: true,
    entities: [],
  };
}
