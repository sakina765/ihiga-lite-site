import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ChatLanguage } from "../../ai/types";

@Entity("farmers")
export class Farmer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "phone_number", unique: true })
  phoneNumber: string;

  /** Needed to look up weather (Open-Meteo) for this farmer — nullable until they provide it. */
  @Column({ type: "varchar", nullable: true })
  district: string | null;

  @Column({ name: "preferred_language", type: "varchar", length: 2, nullable: true })
  preferredLanguage: ChatLanguage | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  /** Last crop stage id we sent a stage-change SMS for — so the same alert doesn't fire every day. */
  @Column({ name: "last_notified_stage_id", type: "uuid", nullable: true })
  lastNotifiedStageId: string | null;

  /** YYYY-MM-DD — last date we sent a weather-risk SMS, so it fires at most once/day. */
  @Column({ name: "last_notified_weather_alert_date", type: "date", nullable: true })
  lastNotifiedWeatherAlertDate: string | null;

  /** Optional GPS shared at onboarding — enables farm-exact weather instead of a district centroid. */
  @Column({ name: "farm_latitude", type: "double precision", nullable: true })
  farmLatitude: number | null;

  @Column({ name: "farm_longitude", type: "double precision", nullable: true })
  farmLongitude: number | null;
}
