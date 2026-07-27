import type {
  AdminCrop,
  AdminCropStage,
  CreateCropRequest,
  CropImpactResponse,
  CropStageInput,
  UpdateCropRequest,
} from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

async function extractErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  return (data && typeof data.message === "string" ? data.message : null) ?? `Request failed with status ${response.status}`;
}

export async function listAdminCrops(): Promise<AdminCrop[]> {
  const response = await fetch(`${getApiUrl()}/admin/crops`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function createCrop(body: CreateCropRequest): Promise<AdminCrop> {
  const response = await fetch(`${getApiUrl()}/admin/crops`, {
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

export async function updateCrop(id: string, body: UpdateCropRequest): Promise<AdminCrop> {
  const response = await fetch(`${getApiUrl()}/admin/crops/${encodeURIComponent(id)}`, {
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

export async function getCropImpact(id: string): Promise<CropImpactResponse> {
  const response = await fetch(`${getApiUrl()}/admin/crops/${encodeURIComponent(id)}/impact`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function deleteCrop(id: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/crops/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function replaceCropStages(cropId: string, stages: CropStageInput[]): Promise<AdminCropStage[]> {
  const response = await fetch(`${getApiUrl()}/admin/crops/${encodeURIComponent(cropId)}/stages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ stages }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
