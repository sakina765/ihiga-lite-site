import type { CurrentCropResponse, WeatherInfo } from "@ihiga-lite/shared";
import { WeatherIcon } from "./WeatherIcon";

export interface SummaryLines {
  weatherLine: string | null;
  cropLine: string;
}

/**
 * Pure projection of (weather, crop) -> the two headline sentences — kept
 * separate from the component so it's directly unit-testable without
 * rendering anything, across all 4 presence combinations (both/weather-only/
 * crop-only/neither). Never throws regardless of which inputs are null.
 */
export function buildSummaryLines(weather: WeatherInfo | null, crop: CurrentCropResponse | null): SummaryLines {
  const weatherLine = weather
    ? `${weather.todayRainfallProbability}% chance of rain — ${
        weather.soilWorkable ? "good day to work the soil." : (weather.soilWorkableReason ?? "check conditions before working the soil.")
      }`
    : null;

  const cropLine = crop
    ? `Your ${crop.cropName.toLowerCase()} is in the ${crop.stage.name.toLowerCase()} stage — ${crop.stage.taskDescription}`
    : "Tell Ihiga your crop and planting date in chat to see this week's task here.";

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
  if (weatherLoading || cropLoading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md">
        <p className="text-xs text-ink-faint">Loading today&apos;s summary…</p>
      </div>
    );
  }

  const { weatherLine, cropLine } = buildSummaryLines(weatherData, cropData);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md">
      <p className="text-sm font-semibold text-ink">Today&apos;s summary</p>
      <div className="mt-1.5 flex items-start gap-2">
        {weatherData && <WeatherIcon weather={weatherData} size={20} />}
        <p className="text-sm text-ink-soft">
          {weatherLine ?? (weatherError ? "Weather unavailable right now." : "Add your district at registration to see today's weather here.")}
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
