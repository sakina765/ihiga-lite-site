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
  farmerId: string;
  message: string;
  cropId?: string;
  /** YYYY-MM-DD */
  plantingDate?: string;
  language?: ChatLanguage;
}

export interface RegisterFarmerRequest {
  phoneNumber: string;
  district?: string;
  /** Optional GPS shared at onboarding — enables farm-exact weather instead of a district centroid. */
  latitude?: number;
  longitude?: number;
}

export interface RegisterFarmerResponse {
  farmerId: string;
  phoneNumber: string;
  district: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface WeatherOutlookDay {
  /** YYYY-MM-DD */
  date: string;
  rainfallProbability: number;
  rainfallMm: number;
}

export interface WeatherInfo {
  district: string;
  todayRainfallProbability: number;
  todayRainfallMm: number;
  /** false = heavy rain today (or very likely) — better to wait before working the soil. */
  soilWorkable: boolean;
  soilWorkableReason?: string;
  outlook: WeatherOutlookDay[];
  /** ISO timestamp — when this forecast was actually fetched (vs served from cache). */
  fetchedAt: string;
}

export interface TodayWeatherResponse {
  district: WeatherInfo | null;
  /** Only present if the farmer has shared farm GPS coordinates. */
  farmExact?: WeatherInfo;
}

export interface ProvinceWeatherRollup {
  province: string;
  districts: { district: string; weather: WeatherInfo }[];
}

export interface CropSuggestion {
  name: string;
  localName?: string;
  note?: string;
}

export interface CropSuggestionsResponse {
  season: SeasonInfo;
  province: string | null;
  crops: CropSuggestion[];
}

export interface CurrentCropResponse {
  cropName: string;
  localName: string;
  stage: CropStageInfo;
  plantingDate: string;
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
