import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Crop } from "./crop.entity";

@Entity("crop_stages")
export class CropStage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "crop_id" })
  cropId: string;

  @ManyToOne(() => Crop, (crop) => crop.stages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "crop_id" })
  crop: Crop;

  @Column()
  name: string;

  @Column({ name: "order_index" })
  orderIndex: number;

  @Column({ name: "week_start" })
  weekStart: number;

  @Column({ name: "week_end" })
  weekEnd: number;

  @Column({ name: "task_description", type: "text" })
  taskDescription: string;

  @Column({ name: "task_description_rw", type: "text" })
  taskDescriptionRw: string;
}
