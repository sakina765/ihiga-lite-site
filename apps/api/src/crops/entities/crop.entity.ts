import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CropStage } from "./crop-stage.entity";

@Entity("crops")
export class Crop {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ name: "local_name" })
  localName: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @OneToMany(() => CropStage, (stage) => stage.crop)
  stages: CropStage[];
}
