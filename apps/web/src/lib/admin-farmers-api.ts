import type { AdminFarmerDetailResponse, AdminFarmerProfile, AdminFarmersListResponse } from "@ihiga-lite/shared";

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

/** Irreversible — see FarmersService.deactivate's doc comment. The API route is still named "deactivate" (unchanged, tested), but this now also permanently frees the farmer's phone number for reuse. */
export async function deleteFarmer(id: string): Promise<AdminFarmerProfile> {
  const response = await fetch(`${getApiUrl()}/admin/farmers/${encodeURIComponent(id)}/deactivate`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
