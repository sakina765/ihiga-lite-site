import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ChatLanguage } from "../../ai/types";

export type FarmerRole = "farmer" | "admin";

/**
 * PII retention (Phase 10a #10 — deliberate, not accidental): phoneNumber,
 * district, villageText, and every coordinate column below are stored in
 * plaintext, indefinitely, with no automatic purge/anonymization job and no
 * column-level encryption at rest. There is also no delete-farmer endpoint
 * today, so this data currently has no expiry path at all short of a manual
 * DB operation. Acceptable for now at this project's current scale, but this
 * must be revisited before scaling to real production traffic — a data
 * retention policy and (if this ever needs to satisfy something like GDPR's
 * "right to erasure") an actual deletion/anonymization path.
 */
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

  /**
   * Raw device GPS reading from the onboarding "Share my farm location"
   * shortcut — kept as-is for backward compatibility with farmers who
   * registered before the cascading location picker existed. When the GPS
   * shortcut is used to auto-fill the cascading picker, this stays populated
   * as the original reading even after sectorId/resolvedLatitude are set.
   */
  @Column({ name: "farm_latitude", type: "double precision", nullable: true })
  farmLatitude: number | null;

  @Column({ name: "farm_longitude", type: "double precision", nullable: true })
  farmLongitude: number | null;

  /** Sector chosen via the cascading location picker (manually or GPS-auto-filled-then-reviewed). Nullable — older farmers may only have a flat `district` string. */
  @Column({ name: "sector_id", type: "uuid", nullable: true })
  sectorId: string | null;

  /** Optional free-text village/cell name, geocoded via GeocodingService. */
  @Column({ name: "village_text", type: "varchar", nullable: true })
  villageText: string | null;

  /**
   * Final resolved farm coordinate for weather lookups, in precedence order:
   * geocoded village > chosen sector's centroid > (fallback) farmLatitude/
   * farmLongitude. Distinct from farmLatitude/farmLongitude because those
   * are the raw device reading, while this is the farmer-reviewed/confirmed
   * location once resolved through the picker.
   */
  @Column({ name: "resolved_latitude", type: "double precision", nullable: true })
  resolvedLatitude: number | null;

  @Column({ name: "resolved_longitude", type: "double precision", nullable: true })
  resolvedLongitude: number | null;

  /** "admin" is granted manually via the promote-to-admin CLI script — there is no self-service admin signup. */
  @Column({ type: "varchar", length: 10, default: "farmer" })
  role: FarmerRole;

  /** Only ever set for role === "admin" rows — regular farmers have no password and never authenticate. */
  @Column({ name: "password_hash", type: "varchar", nullable: true })
  passwordHash: string | null;

  /**
   * Set by an admin (see AdminFarmersController) when a farmer account is
   * deactivated — a soft delete, never a row deletion, since farmer data is
   * never destroyed silently. A non-null value blocks new chat replies
   * (ChatOrchestratorService returns a deactivation notice instead of calling
   * Groq — real anti-abuse/cost-control teeth, not just an admin-facing
   * label) and excludes the farmer from the daily SMS job. Re-registering
   * with the same phone number does NOT clear this — registerOrFind's
   * backfill-only writes never touch it, so a deactivated farmer can't
   * simply re-register their way back to active.
   */
  @Column({ name: "deactivated_at", type: "timestamp", nullable: true })
  deactivatedAt: Date | null;
}
