import { Module } from "@nestjs/common";
import { SeasonModule } from "../season/season.module";
import { CropsModule } from "../crops/crops.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { ChatModule } from "../chat/chat.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { WeatherModule } from "../weather/weather.module";
import { DebugController } from "./debug.controller";

// PROTECTED — only imported by AppModule when NODE_ENV !== "production". See debug.controller.ts.
@Module({
  imports: [SeasonModule, CropsModule, KnowledgeModule, ChatModule, NotificationsModule, WeatherModule],
  controllers: [DebugController],
})
export class DebugModule {}
