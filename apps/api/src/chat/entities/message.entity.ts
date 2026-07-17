import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "./conversation.entity";

export type MessageRole = "user" | "bot";

/** Input modality that produced this message. Bot replies are always "text" — the bot itself never sends voice/photos. */
export type MessageType = "text" | "voice" | "photo";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "conversation_id" })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "conversation_id" })
  conversation: Conversation;

  @Column({ type: "varchar", length: 4 })
  role: MessageRole;

  @Column({ type: "varchar", length: 5, default: "text" })
  type: MessageType;

  @Column({ type: "text" })
  text: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
