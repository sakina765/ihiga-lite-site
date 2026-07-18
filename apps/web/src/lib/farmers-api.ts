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
