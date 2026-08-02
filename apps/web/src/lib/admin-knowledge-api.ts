import type { CreateKnowledgeFactRequest, KnowledgeFact, UpdateKnowledgeFactRequest } from "@ihiga-lite/shared";

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

export interface KnowledgeFactFilter {
  cropId?: string;
  topic?: string;
  reviewed?: "true" | "false";
}

export async function listKnowledgeFacts(filter: KnowledgeFactFilter): Promise<KnowledgeFact[]> {
  const params = new URLSearchParams();
  if (filter.cropId) params.set("cropId", filter.cropId);
  if (filter.topic) params.set("topic", filter.topic);
  if (filter.reviewed) params.set("reviewed", filter.reviewed);

  const response = await fetch(`${getApiUrl()}/admin/knowledge-facts?${params.toString()}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function createKnowledgeFact(body: CreateKnowledgeFactRequest): Promise<KnowledgeFact> {
  const response = await fetch(`${getApiUrl()}/admin/knowledge-facts`, {
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

export async function updateKnowledgeFact(id: string, body: UpdateKnowledgeFactRequest): Promise<KnowledgeFact> {
  const response = await fetch(`${getApiUrl()}/admin/knowledge-facts/${encodeURIComponent(id)}`, {
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

export async function markKnowledgeFactReviewed(id: string): Promise<KnowledgeFact> {
  const response = await fetch(`${getApiUrl()}/admin/knowledge-facts/${encodeURIComponent(id)}/review`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function deleteKnowledgeFact(id: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/knowledge-facts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}
