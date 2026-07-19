import type { ProvinceWeatherRollup, SectorWeather, TodayWeatherResponse } from "@ihiga-lite/shared";

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

/** Sidebar's District -> Sector drill-down — fetched lazily, only once a district is expanded. */
export async function getSectorWeather(district: string): Promise<SectorWeather[]> {
  const response = await fetch(`${getApiUrl()}/weather/sectors?district=${encodeURIComponent(district)}`);

  if (!response.ok) {
    throw new Error(`Sector weather request failed with status ${response.status}`);
  }

  return response.json();
}
