import type { TodayWeatherResponse } from "@ihiga-lite/shared";

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
    return <p className="text-xs text-ink-faint">Add your district at registration to see local weather here.</p>;
  }

  const weather = data.farmExact ?? data.district;
  const label = data.farmExact ? "Your farm" : data.district.district;

  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium text-ink">{label}</p>
      <p className="text-ink-soft">
        {weather.todayRainfallProbability}% chance of rain, {weather.todayRainfallMm}mm expected today.
      </p>
      <p className={weather.soilWorkable ? "text-sage-dark" : "text-clay"}>
        {weather.soilWorkable ? "Good day to work the soil." : weather.soilWorkableReason}
      </p>
    </div>
  );
}
