import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { ChatController } from "./chat.controller";
import { LanguageModule } from "../language/language.module";
import { SeasonModule } from "../season/season.module";
import { CropsModule } from "../crops/crops.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { AiModule } from "../ai/ai.module";
import { FarmersModule } from "../farmers/farmers.module";
import { WeatherModule } from "../weather/weather.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    LanguageModule,
    SeasonModule,
    CropsModule,
    KnowledgeModule,
    AiModule,
    FarmersModule,
    WeatherModule,
  ],
  providers: [ChatOrchestratorService],
  controllers: [ChatController],
  exports: [ChatOrchestratorService],
})
export class ChatModule {}
