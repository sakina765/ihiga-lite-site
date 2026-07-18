import type { CropSuggestionsResponse, CurrentCropResponse } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function getCropSuggestions(farmerId: string): Promise<CropSuggestionsResponse> {
  const response = await fetch(`${getApiUrl()}/crops/suggestions?farmerId=${encodeURIComponent(farmerId)}`);

  if (!response.ok) {
    throw new Error(`Crop suggestions request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getCurrentCrop(farmerId: string): Promise<CurrentCropResponse | null> {
  const response = await fetch(`${getApiUrl()}/crops/current-crop?farmerId=${encodeURIComponent(farmerId)}`);

  if (!response.ok) {
    throw new Error(`Current crop request failed with status ${response.status}`);
  }

  // A farmer with no crop/planting-date on any conversation gets a 200 with a
  // genuinely empty body (verified against the running API), not the literal
  // text "null" — response.json() would throw on that, so read as text first.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
