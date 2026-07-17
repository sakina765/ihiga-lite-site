import type { SeasonInfo } from "../season/season.types";
import type { ChatLanguage, CropStageInfo } from "../ai/types";

export interface HandleMessageParams {
  conversationId?: string;
  message: string;
  cropId?: string;
  /** YYYY-MM-DD */
  plantingDate?: string;
  /** Explicit user-chosen language override — takes priority over auto-detection. */
  language?: ChatLanguage;
}

export interface ChatResponse {
  conversationId: string;
  replyText: string;
  suggestedChips: string[];
  season: SeasonInfo;
  cropStage?: CropStageInfo;
}
