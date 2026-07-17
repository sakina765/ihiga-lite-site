import { Module } from "@nestjs/common";
import { SeasonModule } from "../season/season.module";
import { CropsModule } from "../crops/crops.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { ChatModule } from "../chat/chat.module";
import { DebugController } from "./debug.controller";

// TEMPORARY — REMOVE OR PROTECT BEFORE PRODUCTION. See debug.controller.ts.
@Module({
  imports: [SeasonModule, CropsModule, KnowledgeModule, ChatModule],
  controllers: [DebugController],
})
export class DebugModule {}
