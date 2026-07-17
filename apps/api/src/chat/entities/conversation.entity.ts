import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ChatLanguage } from "../../ai/types";
import { Message } from "./message.entity";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ type: "varchar", length: 2, nullable: true })
  language: ChatLanguage | null;

  @Column({ name: "crop_id", type: "uuid", nullable: true })
  cropId: string | null;

  @Column({ name: "planting_date", type: "date", nullable: true })
  plantingDate: string | null;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
