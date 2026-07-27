import { Column, Entity, PrimaryColumn } from "typeorm";
import { SeasonCode } from "../season.constants";

/**
 * Exactly 3 rows (A/B/C), keyed by their season code rather than a surrogate
 * uuid — there is no "create a new season" concept for Rwanda's calendar,
 * only editing the 3 existing ones (see the admin panel's Phase 3).
 */
@Entity("season_boundaries")
export class SeasonBoundaryEntity {
  @PrimaryColumn({ type: "varchar", length: 1 })
  code: SeasonCode;

  @Column({ name: "local_name" })
  localName: string;

  @Column({ name: "english_name" })
  englishName: string;

  /** 1-indexed (1 = January), year-agnostic — see SeasonBoundary in season.constants.ts. */
  @Column({ name: "start_month" })
  startMonth: number;

  @Column({ name: "start_day" })
  startDay: number;

  @Column({ name: "end_month" })
  endMonth: number;

  @Column({ name: "end_day" })
  endDay: number;
}
