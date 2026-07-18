import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { Farmer } from "../farmers/entities/farmer.entity";
import { Conversation } from "../chat/entities/conversation.entity";
import { CropsService } from "../crops/crops.service";
import { WeatherService } from "../weather/weather.service";
import { SmsService } from "./sms.service";
import { parseIsoDateStringLocal } from "../common/date.util";
import { ChatLanguage } from "../ai/types";

export type NotificationOutcome = "sent" | "skipped" | "failed";

export interface NotificationResult {
  farmerId: string;
  outcome: NotificationOutcome;
  reason: string;
}

const STAGE_CHANGE_MESSAGES: Record<ChatLanguage, (stageName: string, task: string) => string> = {
  en: (stageName, task) => `Ihiga: your crop has reached the "${stageName}" stage. ${task}`,
  rw: (stageName, task) => `Ihiga: igihingwa cyawe kigeze mu icyiciro "${stageName}". ${task}`,
  fr: (stageName, task) => `Ihiga : votre culture est entrée dans l'étape "${stageName}". ${task}`,
};

const WEATHER_ALERT_MESSAGES: Record<ChatLanguage, string> = {
  en: "Ihiga: heavy rain is expected today — hold off on working the soil for now.",
  rw: "Ihiga: imvura nyinshi iteganyijwe uyu munsi — tegereza mbere yo gukora ku butaka.",
  fr: "Ihiga : de fortes pluies sont attendues aujourd'hui — évitez de travailler le sol pour l'instant.",
};

function todayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectRepository(Farmer) private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    private readonly cropsService: CropsService,
    private readonly weatherService: WeatherService,
    private readonly smsService: SmsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async runDailyNotifications(): Promise<NotificationResult[]> {
    const farmers = await this.farmerRepository.find();
    const results: NotificationResult[] = [];

    for (const farmer of farmers) {
      try {
        results.push(await this.evaluateFarmer(farmer));
      } catch (error) {
        // Belt-and-suspenders: SmsService itself never throws, but this catches
        // any other unexpected failure (e.g. a DB error) so one bad farmer
        // record can't stop the rest of the batch from being evaluated.
        this.logger.error(`evaluateFarmer(${farmer.id}) threw unexpectedly: ${(error as Error).message}`);
        results.push({ farmerId: farmer.id, outcome: "failed", reason: (error as Error).message });
      }
    }

    const sent = results.filter((r) => r.outcome === "sent").length;
    const failed = results.filter((r) => r.outcome === "failed").length;
    const skipped = results.length - sent - failed;
    this.logger.log(`runDailyNotifications done — farmers=${farmers.length} sent=${sent} skipped=${skipped} failed=${failed}`);

    return results;
  }

  private async evaluateFarmer(farmer: Farmer): Promise<NotificationResult> {
    const conversation = await this.conversationRepository.findOne({
      where: { farmerId: farmer.id, cropId: Not(IsNull()), plantingDate: Not(IsNull()) },
      order: { createdAt: "DESC" },
    });

    if (!conversation?.cropId || !conversation.plantingDate) {
      return { farmerId: farmer.id, outcome: "skipped", reason: "no active crop/planting date on record" };
    }

    let stageChanged = false;
    let stageName: string | undefined;
    let stageTask: string | undefined;
    let newStageId: string | undefined;

    try {
      const plantingDate = parseIsoDateStringLocal(conversation.plantingDate, "plantingDate");
      const stage = await this.cropsService.getCurrentStage(conversation.cropId, plantingDate);
      newStageId = stage.id;
      stageChanged = farmer.lastNotifiedStageId !== stage.id;
      stageName = stage.name;
      stageTask = farmer.preferredLanguage === "rw" && stage.taskDescriptionRw ? stage.taskDescriptionRw : stage.taskDescription;
    } catch (error) {
      this.logger.warn(`evaluateFarmer(${farmer.id}): could not resolve crop stage — ${(error as Error).message}`);
    }

    const todayStr = todayDateString();
    let weatherRisk = false;

    if (farmer.district) {
      try {
        const weather = await this.weatherService.getForecast(farmer.district);
        weatherRisk = !weather.soilWorkable && farmer.lastNotifiedWeatherAlertDate !== todayStr;
      } catch (error) {
        this.logger.warn(`evaluateFarmer(${farmer.id}): weather lookup failed — ${(error as Error).message}`);
      }
    }

    if (!stageChanged && !weatherRisk) {
      return { farmerId: farmer.id, outcome: "skipped", reason: "no new stage change or weather risk" };
    }

    const language: ChatLanguage = farmer.preferredLanguage ?? "en";
    const parts: string[] = [];
    if (stageChanged && stageName && stageTask) {
      parts.push(STAGE_CHANGE_MESSAGES[language](stageName, stageTask));
    }
    if (weatherRisk) {
      parts.push(WEATHER_ALERT_MESSAGES[language]);
    }
    const message = parts.join(" ");

    // SmsService.sendSms() never throws (see its own docstring), so we can't
    // distinguish actual delivery success from failure here. We mark the
    // alert as notified regardless of the outcome once we've attempted it —
    // accepting that a transient send failure means this particular alert
    // won't be retried tomorrow. A future iteration could have SmsService
    // return a delivery-status result if finer-grained retry logic is needed.
    await this.smsService.sendSms(farmer.phoneNumber, message);

    if (stageChanged && newStageId) {
      farmer.lastNotifiedStageId = newStageId;
    }
    if (weatherRisk) {
      farmer.lastNotifiedWeatherAlertDate = todayStr;
    }
    await this.farmerRepository.save(farmer);

    this.logger.log(
      `evaluateFarmer(${farmer.id}): SMS attempt dispatched — stageChanged=${stageChanged} weatherRisk=${weatherRisk}`,
    );
    return { farmerId: farmer.id, outcome: "sent", reason: message };
  }
}
