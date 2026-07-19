import type { TodayWeatherResponse } from "@ihiga-lite/shared";
import { WeatherIcon } from "./WeatherIcon";
import { StatusPill } from "./StatusPill";
import { EmptyStatePrompt } from "./EmptyStatePrompt";
import { useLanguage } from "../../../i18n/LanguageProvider";

export function TodayWeatherCard({
  data,
  loading,
  error,
}: {
  data: TodayWeatherResponse | null;
  loading: boolean;
  error: boolean;
}) {
  const { t } = useLanguage();

  if (loading) {
    return <p className="text-xs text-ink-faint">{t("sidebar.todayWeather.loading")}</p>;
  }
  if (error) {
    return <p className="text-xs text-ink-faint">{t("sidebar.todayWeather.unavailable")}</p>;
  }
  if (!data?.district) {
    return <EmptyStatePrompt icon="☀️" label={t("sidebar.todayWeather.empty")} />;
  }

  const weather = data.farmExact ?? data.district;
  const label = data.farmExact ? t("sidebar.todayWeather.yourFarm") : data.district.district;

  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-ink">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <WeatherIcon weather={weather} size={32} />
          <div>
            <p className="text-xl font-semibold leading-none text-ink">{weather.todayTemperatureC}°C</p>
            <p className="mt-1 text-xs text-ink-soft">
              {weather.todayRainfallProbability}
              {t("sidebar.todayWeather.rainSuffix")}
            </p>
          </div>
        </div>
        <StatusPill tone={weather.soilWorkable ? "good" : "risk"}>
          {weather.soilWorkable ? t("sidebar.todayWeather.goodDaySoil") : weather.soilWorkableReason}
        </StatusPill>
      </div>
    </div>
  );
}
