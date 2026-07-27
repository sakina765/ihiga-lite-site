import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Crop } from "../../crops/entities/crop.entity";

@Entity("knowledge_facts")
export class KnowledgeFact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "crop_id", nullable: true })
  cropId: string | null;

  @ManyToOne(() => Crop, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "crop_id" })
  crop: Crop | null;

  @Column()
  topic: string;

  @Column({ name: "fact_text", type: "text" })
  factText: string;

  @Column({ name: "fact_text_rw", type: "text", nullable: true })
  factTextRw: string | null;

  @Column()
  source: string;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  tags: string[];

  /**
   * Distinguishes seed-time placeholder content (see knowledge.seed-data.ts's
   * SOURCE constant — "RICA (placeholder — replace with validated source)")
   * from facts an admin has actually checked against a real, validated
   * source. Defaults false, including for every existing seeded row, so
   * nothing is silently treated as verified just because this column now
   * exists.
   */
  @Column({ type: "boolean", default: false })
  reviewed: boolean;

  @Column({ name: "reviewed_at", type: "timestamp", nullable: true })
  reviewedAt: Date | null;
}
