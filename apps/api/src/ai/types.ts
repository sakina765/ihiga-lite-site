import type { SeasonInfo } from "../season/season.types";
import type { KnowledgeFact } from "../knowledge/entities/knowledge-fact.entity";
import type { WeatherInfo } from "../weather/weather.types";

export type ChatLanguage = "en" | "rw" | "fr";

export interface CropStageInfo {
  name: string;
  weekStart: number;
  weekEnd: number;
  taskDescription: string;
  taskDescriptionRw: string;
}

export interface ConversationTurn {
  role: "user" | "model";
  text: string;
}

export interface GenerateReplyParams {
  userMessage: string;
  language: ChatLanguage;
  season: SeasonInfo;
  cropStage?: CropStageInfo;
  relevantFacts: KnowledgeFact[];
  conversationHistory?: ConversationTurn[];
  /** Absent when the farmer's district isn't known yet, or the weather lookup failed. */
  weather?: WeatherInfo;
}

export interface StructuredReply {
  replyText: string;
  suggestedChips: string[];
  detectedTopics: string[];
  /**
   * Crop slug confidently mentioned together with a specific planting date in
   * THIS message — matched against the known seeded crop slugs (see
   * KNOWN_CROP_SLUGS in groq.service.ts). Null if not confidently stated, not
   * one of the known crops, or not paired with a date — a wrong extraction is
   * worse than none, so the prompt is instructed to prefer null over guessing.
   */
  extractedCropSlug: string | null;
  /** YYYY-MM-DD — only ever non-null alongside extractedCropSlug. */
  extractedPlantingDate: string | null;
}

export interface AnalyzeImageContext {
  language: ChatLanguage;
  season: SeasonInfo;
  cropStage?: CropStageInfo;
  relevantFacts: KnowledgeFact[];
  /** Optional text the farmer sent alongside the photo. */
  caption?: string;
  weather?: WeatherInfo;
}
