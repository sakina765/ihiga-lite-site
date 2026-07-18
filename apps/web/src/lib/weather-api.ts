import type { ProvinceWeatherRollup, TodayWeatherResponse } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function getTodayWeather(farmerId: string): Promise<TodayWeatherResponse> {
  const response = await fetch(`${getApiUrl()}/weather/today?farmerId=${encodeURIComponent(farmerId)}`);

  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getProvinceWeather(): Promise<ProvinceWeatherRollup[]> {
  const response = await fetch(`${getApiUrl()}/weather/provinces`);

  if (!response.ok) {
    throw new Error(`Province weather request failed with status ${response.status}`);
  }

  return response.json();
}
