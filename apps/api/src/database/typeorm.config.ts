import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function buildTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const useSsl = configService.get<string>("DATABASE_SSL") === "true";

  return {
    type: "postgres",
    url: configService.get<string>("DATABASE_URL"),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    synchronize: configService.get<string>("DATABASE_SYNCHRONIZE") === "true",
    autoLoadEntities: true,
    entities: [],
  };
}
