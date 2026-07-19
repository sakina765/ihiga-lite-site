import type { Sector } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

/** Powers the onboarding cascading picker's sector dropdown, populated once a district is chosen. */
export async function getSectors(district: string): Promise<Sector[]> {
  const response = await fetch(`${getApiUrl()}/location/sectors?district=${encodeURIComponent(district)}`);

  if (!response.ok) {
    throw new Error(`Sectors request failed with status ${response.status}`);
  }

  return response.json();
}

/** GPS shortcut: reverse-resolves a raw coordinate to the closest seeded sector, to auto-fill (and let the farmer review/correct). */
export async function getNearestSector(lat: number, lng: number): Promise<Sector | null> {
  const response = await fetch(`${getApiUrl()}/location/nearest-sector?lat=${lat}&lng=${lng}`);

  if (!response.ok) {
    throw new Error(`Nearest-sector request failed with status ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
