import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "./conversation.entity";

export type MessageRole = "user" | "bot";

/** Input modality that produced this message. Bot replies are always "text" — the bot itself never sends voice/photos. */
export type MessageType = "text" | "voice" | "photo";

/**
 * PII retention (Phase 10a #10 — deliberate, not accidental): `text` is
 * unbounded free-text a farmer can type anything into, including their own
 * PII (name, exact location, phone number typed into the chat itself). It's
 * stored in plaintext, indefinitely, with no automatic purge job and no
 * encryption at rest — same stance as Farmer (see that entity's doc
 * comment). Acceptable for now at this project's current scale, but must be
 * revisited before scaling to real production traffic.
 */
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
