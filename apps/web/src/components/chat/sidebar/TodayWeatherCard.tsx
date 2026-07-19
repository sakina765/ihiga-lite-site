import type { TodayWeatherResponse } from "@ihiga-lite/shared";
import { WeatherIcon } from "./WeatherIcon";
import { StatusPill } from "./StatusPill";
import { EmptyStatePrompt } from "./EmptyStatePrompt";

export function TodayWeatherCard({
  data,
  loading,
  error,
}: {
  data: TodayWeatherResponse | null;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return <p className="text-xs text-ink-faint">Loading weather…</p>;
  }
  if (error) {
    return <p className="text-xs text-ink-faint">Weather unavailable right now.</p>;
  }
  if (!data?.district) {
    return <EmptyStatePrompt icon="☀️" label="Add your district to see local weather here." />;
  }

  const weather = data.farmExact ?? data.district;
  const label = data.farmExact ? "Your farm" : data.district.district;

  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-ink">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <WeatherIcon weather={weather} size={32} />
          <div>
            <p className="text-xl font-semibold leading-none text-ink">{weather.todayTemperatureC}°C</p>
            <p className="mt-1 text-xs text-ink-soft">{weather.todayRainfallProbability}% Rain</p>
          </div>
        </div>
        <StatusPill tone={weather.soilWorkable ? "good" : "risk"}>
          {weather.soilWorkable ? "Good day to work the soil." : weather.soilWorkableReason}
        </StatusPill>
      </div>
    </div>
  );
}
