import type { AdminConversationDetailResponse, AdminMessageDetail } from "@ihiga-lite/shared";

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

export async function getAdminConversationDetail(id: string): Promise<AdminConversationDetailResponse> {
  const response = await fetch(`${getApiUrl()}/admin/conversations/${encodeURIComponent(id)}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function flagMessage(id: string): Promise<AdminMessageDetail> {
  const response = await fetch(`${getApiUrl()}/admin/messages/${encodeURIComponent(id)}/flag`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function unflagMessage(id: string): Promise<AdminMessageDetail> {
  const response = await fetch(`${getApiUrl()}/admin/messages/${encodeURIComponent(id)}/unflag`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
