import type { WeatherInfo } from "@ihiga-lite/shared";

/**
 * Pure condition -> emoji mapping, kept separate from the component so it's
 * directly unit-testable. Only two states exist in the data model
 * (soilWorkable true/false — see WeatherInfo), so this is deliberately a
 * binary sun/rain-cloud choice, not an attempt at a full weather-icon set.
 */
export function weatherIconEmoji(weather: Pick<WeatherInfo, "soilWorkable">): string {
  return weather.soilWorkable ? "☀️" : "🌧️";
}

export function WeatherIcon({ weather, size = 28 }: { weather: Pick<WeatherInfo, "soilWorkable">; size?: number }) {
  return (
    <span aria-hidden="true" style={{ fontSize: size, lineHeight: 1 }}>
      {weatherIconEmoji(weather)}
    </span>
  );
}
