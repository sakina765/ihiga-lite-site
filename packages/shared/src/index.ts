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
  /** Backward-compat flat district string — still accepted, but the cascading picker sends sectorId instead. */
  district?: string;
  /** Optional GPS shared at onboarding — enables farm-exact weather instead of a district centroid. */
  latitude?: number;
  longitude?: number;
  /** Sector chosen via the cascading location picker (manually, or GPS-auto-filled and reviewed). */
  sectorId?: string;
  /** Optional free-text village/cell, geocoded server-side via GeocodingService on registration. */
  villageText?: string;
}

export interface RegisterFarmerResponse {
  farmerId: string;
  phoneNumber: string;
  district: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sectorId?: string | null;
  villageText?: string | null;
  resolvedLatitude?: number | null;
  resolvedLongitude?: number | null;
}

/** A Rwandan sector (umurenge) — powers the onboarding picker's sector dropdown and the sidebar's district drill-down. */
export interface Sector {
  id: string;
  district: string;
  name: string;
  nameRw: string | null;
  lat: number;
  lng: number;
  /** true = seed-time approximation from the district centroid, not a verified sector coordinate. */
  coordinatesApproximated: boolean;
}

/** One row of the sidebar's District -> Sector weather drill-down. */
export interface SectorWeather {
  id: string;
  name: string;
  nameRw: string | null;
  weather: WeatherInfo;
}

export interface WeatherOutlookDay {
  /** YYYY-MM-DD */
  date: string;
  rainfallProbability: number;
  rainfallMm: number;
}

export interface WeatherInfo {
  district: string;
  /** Rounded to the nearest degree Celsius — Open-Meteo's daily max for today. */
  todayTemperatureC: number;
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

/** Manual fallback form's crop dropdown — GET /crops. */
export interface CropOption {
  id: string;
  name: string;
  localName: string;
  slug: string;
}

export interface ChatMessageResponse {
  conversationId: string;
  replyText: string;
  suggestedChips: string[];
  language: ChatLanguage;
  season: SeasonInfo;
  cropStage?: CropStageInfo;
  /**
   * Present when Groq just confidently extracted a crop+planting date this
   * turn and it's awaiting the farmer's confirmation (suggestedChips will
   * contain the confirm/deny pair) — not yet written to the tracked crop.
   */
  pendingCropConfirmation?: {
    cropSlug: string;
    cropName: string;
    /** YYYY-MM-DD */
    plantingDate: string;
  };
}

export interface VoiceChatMessageResponse extends ChatMessageResponse {
  /** What Whisper heard — shown as "you said: ..." once the reply is back. */
  transcribedText: string;
}
