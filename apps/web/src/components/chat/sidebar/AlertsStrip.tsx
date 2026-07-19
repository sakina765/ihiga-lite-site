import type { TodayWeatherResponse } from "@ihiga-lite/shared";
import { useLanguage } from "../../../i18n/LanguageProvider";

/** Always-visible risk banner — reads the same soilWorkable/soilWorkableReason WeatherService already computes. */
export function AlertsStrip({ data }: { data: TodayWeatherResponse | null }) {
  const { t } = useLanguage();
  const weather = data?.farmExact ?? data?.district;
  if (!weather || weather.soilWorkable) {
    return null;
  }

  return (
    <div role="status" className="border-b border-clay/30 bg-clay/10 px-4 py-2 text-xs text-clay backdrop-blur-sm">
      <span aria-hidden="true">⚠️ </span>
      {weather.soilWorkableReason ?? t("sidebar.alerts.defaultReason")}
    </div>
  );
}
