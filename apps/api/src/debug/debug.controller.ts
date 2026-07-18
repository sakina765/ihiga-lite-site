import { BadRequestException, Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { SeasonService } from "../season/season.service";
import { CropsService } from "../crops/crops.service";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { ChatOrchestratorService } from "../chat/chat-orchestrator.service";
import { NotificationSchedulerService } from "../notifications/notification-scheduler.service";
import { WeatherService } from "../weather/weather.service";
import { parseIsoDateStringLocal } from "../common/date.util";
import { SendMessageDto } from "../chat/dto/send-message.dto";

// PROTECTED (as of Phase 6): AppModule only imports DebugModule when
// NODE_ENV !== "production", so none of these routes exist at all in a
// production deployment — not just runtime-guarded. These endpoints exist
// purely for manual verification of the season/crop/knowledge services and
// the chat orchestrator (including real Groq calls) without a real client.
@Controller("debug")
export class DebugController {
  constructor(
    private readonly seasonService: SeasonService,
    private readonly cropsService: CropsService,
    private readonly knowledgeService: KnowledgeService,
    private readonly chatOrchestratorService: ChatOrchestratorService,
    private readonly notificationSchedulerService: NotificationSchedulerService,
    private readonly weatherService: WeatherService,
  ) {}

  @Get("weather")
  getWeather(@Query("district") district?: string) {
    if (!district?.trim()) {
      throw new BadRequestException("district is required (e.g. Musanze, Kigali)");
    }
    return this.weatherService.getForecast(district);
  }

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

  // Hits the real orchestrator end-to-end, including a real Groq API call. Manual testing only.
  @Post("chat/message")
  sendChatMessage(@Body() body: SendMessageDto) {
    return this.chatOrchestratorService.handleMessage(body);
  }

  // Runs the same logic as the @Cron-scheduled daily job, on demand — for
  // manual verification without waiting for the real schedule.
  @Post("notifications/run")
  runNotifications() {
    return this.notificationSchedulerService.runDailyNotifications();
  }
}
