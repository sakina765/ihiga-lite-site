import type { SeasonInfo } from "../season/season.types";
import type { ChatLanguage, CropStageInfo } from "../ai/types";
import type { MessageType } from "./entities/message.entity";

export interface HandleMessageParams {
  conversationId?: string;
  message: string;
  cropId?: string;
  /** YYYY-MM-DD */
  plantingDate?: string;
  /** Explicit user-chosen language override — takes priority over auto-detection. */
  language?: ChatLanguage;
  /** Input modality that produced `message` — defaults to "text". */
  messageType?: MessageType;
}

export interface HandlePhotoMessageParams {
  conversationId?: string;
  imageBuffer: Buffer;
  mimeType: string;
  /** Optional text the farmer sent alongside the photo. */
  caption?: string;
  cropId?: string;
  /** YYYY-MM-DD */
  plantingDate?: string;
  language?: ChatLanguage;
}

export interface ChatResponse {
  conversationId: string;
  replyText: string;
  suggestedChips: string[];
  /** Resolved language for this turn (auto-detected or overridden) — lets the client show what Ihiga thinks it's speaking. */
  language: ChatLanguage;
  season: SeasonInfo;
  cropStage?: CropStageInfo;
}

export interface VoiceChatResponse extends ChatResponse {
  /** What Whisper heard — the UI shows this as "you said: ..." once the reply is back. */
  transcribedText: string;
}
