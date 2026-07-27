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
  /** UI language chosen at onboarding (Phase 9) — becomes the authoritative override for Groq's replies too. */
  preferredLanguage?: ChatLanguage;
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
  preferredLanguage?: ChatLanguage | null;
}

export interface UpdatePreferredLanguageRequest {
  preferredLanguage: ChatLanguage;
}

export interface UpdatePreferredLanguageResponse {
  farmerId: string;
  preferredLanguage: ChatLanguage;
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

export type ChatMessageKind = "text" | "voice" | "photo";

export interface ConversationMessage {
  role: "user" | "bot";
  type: ChatMessageKind;
  text: string;
  /** ISO timestamp */
  createdAt: string;
}

/** GET /chat/:id — powers resuming a conversation after a refresh or navigating away and back. */
export interface ConversationHistoryResponse {
  conversationId: string;
  language: ChatLanguage;
  season: SeasonInfo;
  cropStage?: CropStageInfo;
  messages: ConversationMessage[];
}

// --- Admin panel: knowledge base (Phase 2) ---

/** Nested crop summary as returned by GET /admin/knowledge-facts's leftJoinAndSelect — not the full CropOption shape. */
export interface KnowledgeFactCrop {
  id: string;
  name: string;
  localName: string;
  slug: string;
}

export interface KnowledgeFact {
  id: string;
  cropId: string | null;
  /** Absent on create/update responses (no join there); present on the list endpoint. */
  crop?: KnowledgeFactCrop | null;
  topic: string;
  factText: string;
  factTextRw: string | null;
  source: string;
  tags: string[];
  /** False for every seeded placeholder fact by default — see KnowledgeFact.entity.ts. */
  reviewed: boolean;
  /** ISO timestamp, or null if never reviewed. */
  reviewedAt: string | null;
}

export interface CreateKnowledgeFactRequest {
  cropId?: string;
  topic: string;
  factText: string;
  factTextRw?: string;
  source: string;
  tags?: string[];
}

/** Every field optional (partial update) — cropId/factTextRw additionally accept explicit `null` to clear an existing value. */
export interface UpdateKnowledgeFactRequest {
  cropId?: string | null;
  topic?: string;
  factText?: string;
  factTextRw?: string | null;
  source?: string;
  tags?: string[];
}

// --- Admin panel: crop, stage & season reference data (Phase 3) ---

export interface AdminCropStage {
  id: string;
  cropId: string;
  name: string;
  orderIndex: number;
  weekStart: number;
  weekEnd: number;
  taskDescription: string;
  taskDescriptionRw: string;
}

/** GET /admin/crops — same rows as public GET /crops, but with stages eagerly loaded and sorted. */
export interface AdminCrop {
  id: string;
  name: string;
  localName: string;
  slug: string;
  description: string | null;
  stages: AdminCropStage[];
}

export interface CreateCropRequest {
  name: string;
  localName: string;
  slug: string;
  description?: string;
}

export interface UpdateCropRequest {
  name?: string;
  localName?: string;
  slug?: string;
  description?: string;
}

export interface CropStageInput {
  name: string;
  weekStart: number;
  weekEnd: number;
  taskDescription: string;
  taskDescriptionRw: string;
}

export interface CropImpactResponse {
  trackingConversationsCount: number;
}

/** GET/PATCH /admin/season-boundaries — the raw editable month/day boundaries, not the resolved SeasonInfo shape the chat API returns. */
export interface AdminSeasonBoundary {
  code: "A" | "B" | "C";
  localName: string;
  englishName: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface UpdateSeasonBoundaryRequest {
  localName?: string;
  englishName?: string;
  startMonth?: number;
  startDay?: number;
  endMonth?: number;
  endDay?: number;
}

// --- Admin panel: farmer oversight (Phase 4) ---

export interface AdminFarmerListItem {
  id: string;
  phoneNumber: string;
  /** Called "region" in the admin UI. */
  district: string | null;
  preferredLanguage: ChatLanguage | null;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp, or null if the account is active. */
  deactivatedAt: string | null;
  trackedCropName: string | null;
}

export interface AdminFarmersListResponse {
  items: AdminFarmerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** Farmer's own fields, minus passwordHash — the API never sends that, even to an admin. */
export interface AdminFarmerProfile {
  id: string;
  phoneNumber: string;
  district: string | null;
  preferredLanguage: ChatLanguage | null;
  createdAt: string;
  lastNotifiedStageId: string | null;
  lastNotifiedWeatherAlertDate: string | null;
  farmLatitude: number | null;
  farmLongitude: number | null;
  sectorId: string | null;
  villageText: string | null;
  resolvedLatitude: number | null;
  resolvedLongitude: number | null;
  role: "farmer" | "admin";
  deactivatedAt: string | null;
}

export interface AdminFarmerDetailSector {
  id: string;
  district: string;
  name: string;
  nameRw: string | null;
  lat: number;
  lng: number;
}

export interface AdminFarmerConversationSummary {
  id: string;
  /** ISO timestamp */
  createdAt: string;
  language: ChatLanguage | null;
  cropName: string | null;
  messageCount: number;
}

export interface AdminFarmerDetailResponse {
  farmer: AdminFarmerProfile;
  sector: AdminFarmerDetailSector | null;
  conversations: AdminFarmerConversationSummary[];
}

// --- Admin panel: conversation monitoring (Phase 5) ---

export interface AdminRetrievedFact {
  id: string;
  topic: string;
  factText: string;
}

export interface AdminMessageDetail {
  id: string;
  role: "user" | "bot";
  type: ChatMessageKind;
  text: string;
  /** ISO timestamp */
  createdAt: string;
  /**
   * Facts available to Groq when it wrote this reply — not necessarily all
   * cited in the final text, just what was in CONTEXT. Null means "not
   * recorded for this reply" (written before this tracking existed, or a
   * deterministic non-Groq reply like a tracking confirmation), distinct
   * from an empty array ("recorded, and zero facts were retrieved").
   */
  retrievedFacts: AdminRetrievedFact[] | null;
  flagged: boolean;
  /** ISO timestamp, or null if never flagged. */
  flaggedAt: string | null;
}

export interface AdminConversationDetailResponse {
  id: string;
  /** ISO timestamp */
  createdAt: string;
  language: ChatLanguage | null;
  farmerId: string | null;
  cropName: string | null;
  /** YYYY-MM-DD, or null */
  plantingDate: string | null;
  messages: AdminMessageDetail[];
}

// --- Admin panel: alerts log (Phase 6) ---

export type SmsSendOutcome = "sent" | "not_configured" | "failed";

export interface AdminAlertLogItem {
  id: string;
  farmerId: string;
  farmerPhoneNumber: string;
  stageChanged: boolean;
  weatherRisk: boolean;
  message: string;
  /** "sent" only means Africa's Talking accepted the API call — see providerStatus/providerCost for what it actually reported, and this project's sandbox-only caveat (a real phone is not guaranteed to receive anything). */
  outcome: SmsSendOutcome;
  providerStatus: string | null;
  providerStatusCode: number | null;
  providerCost: string | null;
  errorMessage: string | null;
  /** ISO timestamp */
  createdAt: string;
}

export interface AdminAlertsListResponse {
  items: AdminAlertLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Admin panel: region reference data (Phase 7) ---

/** Full CRUD — Sector is the only DB-backed level of Rwanda's location hierarchy in this codebase. */
export interface AdminSector {
  id: string;
  district: string;
  name: string;
  nameRw: string | null;
  lat: number;
  lng: number;
  /** true = seed-time approximation from the district centroid, not a verified sector coordinate. */
  coordinatesApproximated: boolean;
}

export interface CreateSectorRequest {
  district: string;
  name: string;
  nameRw?: string;
  lat: number;
  lng: number;
  coordinatesApproximated?: boolean;
}

export interface UpdateSectorRequest {
  district?: string;
  name?: string;
  nameRw?: string;
  lat?: number;
  lng?: number;
  coordinatesApproximated?: boolean;
}

export interface SectorImpactResponse {
  trackingFarmersCount: number;
}

/**
 * Read-only — District coordinates live in a hardcoded TS file in this
 * codebase, not a database table, unlike Sector. Province has no coordinate
 * concept of its own here at all; it only ever appears as this grouping
 * label.
 */
export interface AdminDistrictItem {
  district: string;
  province: string | undefined;
  lat: number;
  lon: number;
}
