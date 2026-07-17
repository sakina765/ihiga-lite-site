import { BadRequestException, Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { SeasonService } from "../season/season.service";
import { CropsService } from "../crops/crops.service";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { ChatOrchestratorService } from "../chat/chat-orchestrator.service";
import { ChatLanguage } from "../ai/types";
import { parseIsoDateStringLocal } from "../common/date.util";

interface DebugChatMessageBody {
  conversationId?: string;
  message: string;
  cropId?: string;
  plantingDate?: string;
  language?: ChatLanguage;
}

// TEMPORARY — REMOVE OR PROTECT (e.g. behind auth/env guard) BEFORE PRODUCTION.
// These endpoints exist only for manual verification of the season/crop/knowledge
// services and the chat orchestrator (including real Gemini calls) without a real client.
@Controller("debug")
export class DebugController {
  constructor(
    private readonly seasonService: SeasonService,
    private readonly cropsService: CropsService,
    private readonly knowledgeService: KnowledgeService,
    private readonly chatOrchestratorService: ChatOrchestratorService,
  ) {}

  @Get("season")
  getSeason(@Query("date") date?: string) {
    const parsed = date ? parseIsoDateStringLocal(date, "date") : undefined;
    return this.seasonService.getCurrentSeason(parsed);
  }

  @Get("crops/:slug/stage")
  async getCropStage(@Param("slug") slug: string, @Query("plantingDate") plantingDate?: string) {
    if (!plantingDate) {
      throw new BadRequestException("plantingDate is required (YYYY-MM-DD)");
    }
    const parsedPlantingDate = parseIsoDateStringLocal(plantingDate, "plantingDate");
    const crop = await this.cropsService.getCropBySlug(slug);
    return this.cropsService.getCurrentStage(crop.id, parsedPlantingDate);
  }

  @Get("knowledge/search")
  searchKnowledge(@Query("q") q?: string, @Query("cropId") cropId?: string, @Query("topic") topic?: string) {
    return this.knowledgeService.search(q ?? "", cropId, topic);
  }

  // Hits the real orchestrator end-to-end, including a real Gemini API call. Manual testing only.
  @Post("chat/message")
  sendChatMessage(@Body() body: DebugChatMessageBody) {
    if (!body?.message?.trim()) {
      throw new BadRequestException("message is required");
    }
    return this.chatOrchestratorService.handleMessage(body);
  }
}
