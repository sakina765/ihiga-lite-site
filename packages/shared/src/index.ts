export interface HealthCheckResponse {
  status: "ok" | "error";
  db: boolean;
}

export type ChatLanguage = "en" | "rw" | "fr";

/** Wire-format season info — dates arrive as ISO strings over JSON, not Date objects. */
export interface SeasonInfo {
  code: "A" | "B" | "C";
  localName: string;
  englishName: string;
  startDate: string;
  endDate: string;
}

export interface CropStageInfo {
  name: string;
  weekStart: number;
  weekEnd: number;
  taskDescription: string;
  taskDescriptionRw: string;
}

export interface ChatMessageRequest {
  conversationId?: string;
  message: string;
  cropId?: string;
  /** YYYY-MM-DD */
  plantingDate?: string;
  language?: ChatLanguage;
}

export interface ChatMessageResponse {
  conversationId: string;
  replyText: string;
  suggestedChips: string[];
  language: ChatLanguage;
  season: SeasonInfo;
  cropStage?: CropStageInfo;
}

export interface VoiceChatMessageResponse extends ChatMessageResponse {
  /** What Whisper heard — shown as "you said: ..." once the reply is back. */
  transcribedText: string;
}
