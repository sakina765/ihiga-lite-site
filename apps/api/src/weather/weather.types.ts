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
