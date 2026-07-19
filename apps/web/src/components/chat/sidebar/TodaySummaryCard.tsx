import type { CurrentCropResponse, WeatherInfo } from "@ihiga-lite/shared";
import { WeatherIcon } from "./WeatherIcon";
import { useLanguage } from "../../../i18n/LanguageProvider";

export interface SummaryLines {
  weatherLine: string | null;
  cropLine: string;
}

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Pure projection of (weather, crop) -> the two headline sentences — kept
 * separate from the component so it's directly unit-testable without
 * rendering anything, across all 4 presence combinations (both/weather-only/
 * crop-only/neither). Never throws regardless of which inputs are null.
 * Takes `t` as a parameter (rather than calling useLanguage itself) so it
 * stays a plain, renderless, directly-testable function.
 */
export function buildSummaryLines(weather: WeatherInfo | null, crop: CurrentCropResponse | null, t: TranslateFn): SummaryLines {
  const weatherLine = weather
    ? t("sidebar.todaySummary.weatherLine", {
        pct: weather.todayRainfallProbability,
        reason: weather.soilWorkable
          ? t("sidebar.todaySummary.goodDaySoil")
          : (weather.soilWorkableReason ?? t("sidebar.todaySummary.checkConditions")),
      })
    : null;

  const cropLine = crop
    ? t("sidebar.todaySummary.cropLine", {
        crop: crop.cropName.toLowerCase(),
        stage: crop.stage.name.toLowerCase(),
        task: crop.stage.taskDescription,
      })
    : t("sidebar.todaySummary.cropEmpty");

  return { weatherLine, cropLine };
}

export function TodaySummaryCard({
  weatherData,
  weatherLoading,
  weatherError,
  cropData,
  cropLoading,
}: {
  weatherData: WeatherInfo | null;
  weatherLoading: boolean;
  weatherError: boolean;
  cropData: CurrentCropResponse | null;
  cropLoading: boolean;
}) {
  const { t } = useLanguage();

  if (weatherLoading || cropLoading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md">
        <p className="text-xs text-ink-faint">{t("sidebar.todaySummary.loading")}</p>
      </div>
    );
  }

  const { weatherLine, cropLine } = buildSummaryLines(weatherData, cropData, t);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md">
      <p className="text-sm font-semibold text-ink">{t("sidebar.todaySummary.title")}</p>
      <div className="mt-1.5 flex items-start gap-2">
        {weatherData && <WeatherIcon weather={weatherData} size={20} />}
        <p className="text-sm text-ink-soft">
          {weatherLine ?? (weatherError ? t("sidebar.todaySummary.weatherError") : t("sidebar.todaySummary.weatherEmpty"))}
        </p>
      </div>
      <div className="mt-1.5 flex items-start gap-2">
        <span aria-hidden="true" className="text-base leading-none">
          🌱
        </span>
        <p className="text-sm text-ink-soft">{cropLine}</p>
      </div>
    </div>
  );
}
