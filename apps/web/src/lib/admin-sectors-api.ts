import type { AdminSector, CreateSectorRequest, SectorImpactResponse, UpdateSectorRequest } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

async function extractErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  const message = data?.message;
  if (typeof message === "string") {
    return message;
  }
  // NestJS's ValidationPipe always returns `message` as an array of
  // constraint-violation strings, even for a single failing field.
  if (Array.isArray(message) && message.every((entry) => typeof entry === "string")) {
    return message.join("; ");
  }
  return `Request failed with status ${response.status}`;
}

export async function listAdminSectors(district?: string): Promise<AdminSector[]> {
  const query = district ? `?district=${encodeURIComponent(district)}` : "";
  const response = await fetch(`${getApiUrl()}/admin/sectors${query}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function createSector(body: CreateSectorRequest): Promise<AdminSector> {
  const response = await fetch(`${getApiUrl()}/admin/sectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function updateSector(id: string, body: UpdateSectorRequest): Promise<AdminSector> {
  const response = await fetch(`${getApiUrl()}/admin/sectors/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function getSectorImpact(id: string): Promise<SectorImpactResponse> {
  const response = await fetch(`${getApiUrl()}/admin/sectors/${encodeURIComponent(id)}/impact`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function deleteSector(id: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/sectors/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}
