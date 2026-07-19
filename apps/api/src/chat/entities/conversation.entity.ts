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

  // Nullable for backward compatibility with any conversations created before
  // Phase 5 — required in practice going forward since /chat/* now rejects
  // requests without a farmerId.
  @Column({ name: "farmer_id", type: "uuid", nullable: true })
  farmerId: string | null;

  @Column({ name: "crop_id", type: "uuid", nullable: true })
  cropId: string | null;

  @Column({ name: "planting_date", type: "date", nullable: true })
  plantingDate: string | null;

  /**
   * Set when Groq confidently extracted a crop+planting date from a message
   * but hasn't been confirmed by the farmer yet (see ChatOrchestratorService's
   * propose/confirm flow) — deliberately separate from cropId/plantingDate
   * above, which only ever get written once the farmer actually confirms.
   * Cleared (both fields) the moment the next message is handled, whether
   * that message confirms, declines, or ignores the proposal.
   */
  @Column({ name: "pending_crop_slug", type: "varchar", nullable: true })
  pendingCropSlug: string | null;

  @Column({ name: "pending_planting_date", type: "date", nullable: true })
  pendingPlantingDate: string | null;

  /**
   * Set once the farmer has explicitly declined (or ignored) a crop-tracking
   * proposal in this conversation — permanently suppresses further
   * auto-extraction proposals for the rest of THIS conversation (see
   * maybeProposeCropTracking), so declining doesn't just clear the one
   * pending proposal only for Groq's very next reply to immediately
   * re-extract the same crop+date and re-propose it. The manual fallback
   * form in the sidebar remains available regardless of this flag.
   */
  @Column({ name: "crop_tracking_declined", type: "boolean", default: false })
  cropTrackingDeclined: boolean;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
