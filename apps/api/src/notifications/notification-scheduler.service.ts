import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { Farmer } from "../farmers/entities/farmer.entity";
import { Conversation } from "../chat/entities/conversation.entity";
import { NotificationLog } from "./entities/notification-log.entity";
import { CropsService } from "../crops/crops.service";
import { WeatherService } from "../weather/weather.service";
import { SmsService } from "./sms.service";
import { parseIsoDateStringLocal } from "../common/date.util";
import { ChatLanguage } from "../ai/types";
import { SmsSendOutcome } from "./sms.service";

export type NotificationOutcome = "sent" | "skipped" | "failed";

export interface NotificationResult {
  farmerId: string;
  outcome: NotificationOutcome;
  reason: string;
}

export interface AdminAlertLogItem {
  id: string;
  farmerId: string;
  farmerPhoneNumber: string;
  stageChanged: boolean;
  weatherRisk: boolean;
  message: string;
  outcome: SmsSendOutcome;
  providerStatus: string | null;
  providerStatusCode: number | null;
  providerCost: string | null;
  errorMessage: string | null;
  createdAt: Date;
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
    @InjectRepository(NotificationLog) private readonly notificationLogRepository: Repository<NotificationLog>,
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
    if (farmer.deactivatedAt) {
      return { farmerId: farmer.id, outcome: "skipped", reason: "account deactivated" };
    }

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

    // SmsService.sendSms() never throws (see its own docstring) but now
    // returns a real delivery-status result (Phase 6 — this comment used to
    // say a future iteration would add this). We still mark the alert as
    // notified regardless of that outcome once we've attempted it —
    // accepting that a transient send failure means this particular alert
    // won't be retried tomorrow, same policy as before.
    const sendResult = await this.smsService.sendSms(farmer.phoneNumber, message);

    await this.notificationLogRepository.save(
      this.notificationLogRepository.create({
        farmerId: farmer.id,
        stageChanged,
        weatherRisk,
        message,
        outcome: sendResult.outcome,
        providerStatus: sendResult.providerStatus,
        providerStatusCode: sendResult.providerStatusCode,
        providerCost: sendResult.providerCost,
        providerMessageId: sendResult.providerMessageId,
        errorMessage: sendResult.errorMessage,
      }),
    );

    if (stageChanged && newStageId) {
      farmer.lastNotifiedStageId = newStageId;
    }
    if (weatherRisk) {
      farmer.lastNotifiedWeatherAlertDate = todayStr;
    }
    await this.farmerRepository.save(farmer);

    this.logger.log(
      `evaluateFarmer(${farmer.id}): SMS attempt dispatched — stageChanged=${stageChanged} weatherRisk=${weatherRisk} outcome=${sendResult.outcome}`,
    );
    return { farmerId: farmer.id, outcome: "sent", reason: message };
  }

  /**
   * Admin-panel read view (Phase 6) — every genuinely triggered alert, most
   * recent first, with the real Africa's Talking provider fields so the UI
   * can show delivery status honestly rather than implying success means a
   * real phone received it (see SmsService's own doc comment on the sandbox
   * limitation).
   */
  async adminListAlerts(params: { page: number; pageSize: number }): Promise<{ items: AdminAlertLogItem[]; total: number }> {
    const qb = this.notificationLogRepository
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.farmer", "farmer")
      .orderBy("log.createdAt", "DESC");

    const total = await qb.getCount();
    const logs = await qb
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getMany();

    return {
      total,
      items: logs.map((log) => ({
        id: log.id,
        farmerId: log.farmerId,
        farmerPhoneNumber: log.farmer?.phoneNumber ?? "",
        stageChanged: log.stageChanged,
        weatherRisk: log.weatherRisk,
        message: log.message,
        outcome: log.outcome,
        providerStatus: log.providerStatus,
        providerStatusCode: log.providerStatusCode,
        providerCost: log.providerCost,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      })),
    };
  }
}
