import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { buildTypeOrmOptions } from "./database/typeorm.config";
import { HealthModule } from "./health/health.module";
import { AiModule } from "./ai/ai.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SeasonModule } from "./season/season.module";
import { CropsModule } from "./crops/crops.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { LanguageModule } from "./language/language.module";
import { ChatModule } from "./chat/chat.module";
import { DebugModule } from "./debug/debug.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    AiModule,
    NotificationsModule,
    SeasonModule,
    CropsModule,
    KnowledgeModule,
    LanguageModule,
    ChatModule,
    // TEMPORARY — REMOVE OR PROTECT BEFORE PRODUCTION. See debug/debug.controller.ts.
    DebugModule,
  ],
})
export class AppModule {}
