import { Module, ValidationPipe } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { buildTypeOrmOptions } from "./database/typeorm.config";
import { HealthModule } from "./health/health.module";
import { AiModule } from "./ai/ai.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SeasonModule } from "./season/season.module";
import { CropsModule } from "./crops/crops.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { LanguageModule } from "./language/language.module";
import { ChatModule } from "./chat/chat.module";
import { FarmersModule } from "./farmers/farmers.module";
import { WeatherModule } from "./weather/weather.module";
import { LocationModule } from "./location/location.module";
import { DebugModule } from "./debug/debug.module";
import { AppThrottlerGuard } from "./common/app-throttler.guard";
import { GlobalExceptionFilter } from "./common/global-exception.filter";

// DebugModule (the /debug/* controller) is excluded from the module graph
// entirely in production — not just guarded at runtime — so its routes never
// even get registered when NODE_ENV=production. Flagged as
// "REMOVE OR PROTECT BEFORE PRODUCTION" since Phase 1; this is the "protect"
// half of that choice (kept, since it's genuinely useful for local/staging
// manual verification, per every phase's testing so far).
const isProduction = process.env.NODE_ENV === "production";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    ScheduleModule.forRoot(),
    // Baseline: 20 requests/minute per IP across every route by default (see
    // AppThrottlerGuard for the friendly-message/logging wrapper below).
    // Individual controllers override this with a tighter, named limit via
    // @Throttle() where a route is more abusable or expensive (farmer
    // registration, the Groq-backed chat endpoints).
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 20 }]),
    HealthModule,
    AiModule,
    NotificationsModule,
    SeasonModule,
    CropsModule,
    KnowledgeModule,
    LanguageModule,
    ChatModule,
    FarmersModule,
    WeatherModule,
    LocationModule,
    ...(isProduction ? [] : [DebugModule]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    // whitelist: strips unknown fields instead of silently accepting them;
    // forbidNonWhitelisted: rejects the request outright when it carries a
    // field no DTO declares, rather than quietly dropping it.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
