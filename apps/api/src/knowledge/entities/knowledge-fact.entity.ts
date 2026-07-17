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
}
