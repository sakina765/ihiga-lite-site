import type { AdminDistrictItem } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function listAdminDistricts(): Promise<AdminDistrictItem[]> {
  const response = await fetch(`${getApiUrl()}/admin/districts`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}
