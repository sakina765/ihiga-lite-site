import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Farmer } from "../../farmers/entities/farmer.entity";
import { SmsSendOutcome } from "../sms.service";

/**
 * One row per genuinely TRIGGERED alert attempt — i.e. only when
 * NotificationSchedulerService actually decided to call SmsService.sendSms()
 * (a real stage change or weather risk fired). The much more common "skipped
 * — no active crop" / "skipped — no new stage change" outcomes for the rest
 * of the farmer population are NOT logged here; that would be daily
 * per-farmer noise with no admin value, not an "alert" by any reasonable
 * reading of the word.
 */
@Entity("notification_logs")
export class NotificationLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "farmer_id", type: "uuid" })
  farmerId: string;

  @ManyToOne(() => Farmer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "farmer_id" })
  farmer?: Farmer;

  @Column({ name: "stage_changed", type: "boolean" })
  stageChanged: boolean;

  @Column({ name: "weather_risk", type: "boolean" })
  weatherRisk: boolean;

  /** The composed SMS text — server-templated (season/stage/task copy), never farmer-typed content, so this doesn't carry the same PII weight as chat Message.text. */
  @Column({ type: "text" })
  message: string;

  /** "sent" = SmsService attempted a real Africa's Talking call (see providerStatus for what THAT returned) — not proof of real-phone delivery, same caveat as everywhere else this sandbox is discussed. "not_configured"/"failed" mean no message reached Africa's Talking at all, or the call itself errored. */
  @Column({ type: "varchar", length: 20 })
  outcome: SmsSendOutcome;

  @Column({ name: "provider_status", type: "varchar", nullable: true })
  providerStatus: string | null;

  @Column({ name: "provider_status_code", type: "integer", nullable: true })
  providerStatusCode: number | null;

  @Column({ name: "provider_cost", type: "varchar", nullable: true })
  providerCost: string | null;

  @Column({ name: "provider_message_id", type: "varchar", nullable: true })
  providerMessageId: string | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
