import type { AdminSeasonBoundary, UpdateSeasonBoundaryRequest } from "@ihiga-lite/shared";

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

export async function listSeasonBoundaries(): Promise<AdminSeasonBoundary[]> {
  const response = await fetch(`${getApiUrl()}/admin/season-boundaries`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function updateSeasonBoundary(code: string, body: UpdateSeasonBoundaryRequest): Promise<AdminSeasonBoundary> {
  const response = await fetch(`${getApiUrl()}/admin/season-boundaries/${encodeURIComponent(code)}`, {
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
