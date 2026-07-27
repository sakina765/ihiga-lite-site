import type { AdminFarmerDetailResponse, AdminFarmerProfile, AdminFarmersListResponse } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

async function extractErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  return (data && typeof data.message === "string" ? data.message : null) ?? `Request failed with status ${response.status}`;
}

export async function listAdminFarmers(params: { search?: string; page: number; pageSize: number }): Promise<AdminFarmersListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  const response = await fetch(`${getApiUrl()}/admin/farmers?${query.toString()}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function getAdminFarmerDetail(id: string): Promise<AdminFarmerDetailResponse> {
  const response = await fetch(`${getApiUrl()}/admin/farmers/${encodeURIComponent(id)}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function deactivateFarmer(id: string): Promise<AdminFarmerProfile> {
  const response = await fetch(`${getApiUrl()}/admin/farmers/${encodeURIComponent(id)}/deactivate`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function reactivateFarmer(id: string): Promise<AdminFarmerProfile> {
  const response = await fetch(`${getApiUrl()}/admin/farmers/${encodeURIComponent(id)}/reactivate`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
