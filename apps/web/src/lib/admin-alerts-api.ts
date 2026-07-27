import type { AdminAlertsListResponse } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

async function extractErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  return (data && typeof data.message === "string" ? data.message : null) ?? `Request failed with status ${response.status}`;
}

export async function listAdminAlerts(params: { page: number; pageSize: number }): Promise<AdminAlertsListResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  const response = await fetch(`${getApiUrl()}/admin/alerts?${query.toString()}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
