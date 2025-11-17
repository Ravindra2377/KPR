import api from "./client";

const authHeaders = () => ({ headers: { Authorization: `Bearer ${globalThis.__KPR_TOKEN}` } });

export type PresignPayload = {
  purpose: "banner" | "portfolio";
  fileName: string;
  contentType: string;
};

export type PresignResponse = {
  url: string;
  key: string;
  bucket: string;
};

export async function requestPresign(payload: PresignPayload) {
  const response = await api.post<PresignResponse>(`/profile/${payload.purpose}/presign`, payload, authHeaders());
  return response.data;
}

export async function readBlobFromUri(uri: string) {
  const response = await fetch(uri);
  return response.blob();
}

export async function uploadToS3(uploadUrl: string, blob: Blob, contentType: string) {
  const result = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!result.ok) {
    throw new Error(`Upload failed with status ${result.status}`);
  }
}

export async function completeUpload(purpose: PresignPayload["purpose"], key: string, meta?: Record<string, any>, altText?: string) {
  const payload: Record<string, any> = { key, meta };
  if (purpose === "banner") payload.altText = altText;
  const response = await api.post(`/profile/${purpose}/complete`, payload, authHeaders());
  return response.data;
}