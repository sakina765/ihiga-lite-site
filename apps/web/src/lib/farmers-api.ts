import type { RegisterFarmerRequest, RegisterFarmerResponse } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function registerFarmer(body: RegisterFarmerRequest): Promise<RegisterFarmerResponse> {
  const response = await fetch(`${getApiUrl()}/farmers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? `Registration failed with status ${response.status}`);
  }

  return response.json();
}

/** Returns false on any network/response failure — ChatGate treats "couldn't check" the same as "not deactivated" rather than blocking chat over a transient error. */
export async function isFarmerDeactivated(farmerId: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiUrl()}/farmers/${encodeURIComponent(farmerId)}/status`);
    if (!response.ok) {
      return false;
    }
    const data: { deactivated?: boolean } = await response.json();
    return data.deactivated === true;
  } catch {
    return false;
  }
}
