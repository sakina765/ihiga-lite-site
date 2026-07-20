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
  weather?: WeatherInfo;
  seasonalCrops?: string[];
  /**
   * Distinguishes "the farmer hasn't shared a district yet" from "district is
   * known but weather/seasonalCrops still came back empty" (transient lookup
   * failure, or simply no seeded data for that district) — without this,
   * both cases look identical to the model and it can't tell whether asking
   * the farmer for their district again is useful or a repeat of a question
   * they already answered.
   */
  farmerDistrictKnown?: boolean;
}
export interface StructuredReply {
  replyText: string;
  suggestedChips: string[];
  detectedTopics: string[];
  extractedCropSlug: string | null;
  extractedPlantingDate: string | null;
}
export interface AnalyzeImageContext {
  language: ChatLanguage;
  season: SeasonInfo;
  cropStage?: CropStageInfo;
  relevantFacts: KnowledgeFact[];
  caption?: string;
  weather?: WeatherInfo;
  seasonalCrops?: string[];
  farmerDistrictKnown?: boolean;
}
