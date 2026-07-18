import type { ChatLanguage, ChatMessageRequest, ChatMessageResponse, VoiceChatMessageResponse } from "@ihiga-lite/shared";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function sendChatMessage(body: ChatMessageRequest): Promise<ChatMessageResponse> {
  const response = await fetch(`${getApiUrl()}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }

  return response.json();
}

interface SendVoiceMessageParams {
  conversationId?: string;
  farmerId: string;
  audioBlob: Blob;
  cropId?: string;
  plantingDate?: string;
  language?: ChatLanguage;
}

export async function sendVoiceMessage(params: SendVoiceMessageParams): Promise<VoiceChatMessageResponse> {
  const formData = new FormData();
  formData.append("farmerId", params.farmerId);
  if (params.conversationId) formData.append("conversationId", params.conversationId);
  if (params.cropId) formData.append("cropId", params.cropId);
  if (params.plantingDate) formData.append("plantingDate", params.plantingDate);
  if (params.language) formData.append("language", params.language);
  formData.append("audio", params.audioBlob, "recording.webm");

  const response = await fetch(`${getApiUrl()}/chat/voice`, { method: "POST", body: formData });

  if (!response.ok) {
    throw new Error(`Voice request failed with status ${response.status}`);
  }

  return response.json();
}

interface SendPhotoMessageParams {
  conversationId?: string;
  farmerId: string;
  imageFile: File;
  caption?: string;
  cropId?: string;
  plantingDate?: string;
  language?: ChatLanguage;
}

export async function sendPhotoMessage(params: SendPhotoMessageParams): Promise<ChatMessageResponse> {
  const formData = new FormData();
  formData.append("farmerId", params.farmerId);
  if (params.conversationId) formData.append("conversationId", params.conversationId);
  if (params.caption) formData.append("caption", params.caption);
  if (params.cropId) formData.append("cropId", params.cropId);
  if (params.plantingDate) formData.append("plantingDate", params.plantingDate);
  if (params.language) formData.append("language", params.language);
  formData.append("image", params.imageFile, params.imageFile.name || "photo.jpg");

  const response = await fetch(`${getApiUrl()}/chat/photo`, { method: "POST", body: formData });

  if (!response.ok) {
    throw new Error(`Photo request failed with status ${response.status}`);
  }

  return response.json();
}
