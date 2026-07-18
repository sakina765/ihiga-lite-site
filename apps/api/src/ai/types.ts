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
