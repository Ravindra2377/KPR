import api from "./client";
import type { Pod, PodFilterOptions } from "../types/pods";

type DiscoverResponse = {
  items: Pod[];
  total: number;
  page: number;
  limit: number;
};

const authHeaders = () => {
  const token = (globalThis as any).__KPR_TOKEN;
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
};

const buildParams = (params?: PodFilterOptions) => {
  if (!params) return undefined;
  const payload: Record<string, any> = { ...(params as any) };
  if (params.skills?.length) {
    payload.skills = params.skills.join(",");
  }
  if (params.tags?.length) {
    payload.tags = params.tags.join(",");
  }
  return payload;
};

export function fetchPodsDiscover(params?: PodFilterOptions) {
  return api.get<DiscoverResponse>("/pods/discover", { params: buildParams(params) });
}

export function fetchPod(podId: string) {
  return api.get<Pod>(`/pods/${podId}`, authHeaders());
}

export function fetchMyPods() {
  return api.get<Pod[]>("/pods", authHeaders());
}

export function applyToPod(podId: string, roleId: string, message?: string) {
  return api.post(
    `/pods/${podId}/apply`,
    { roleId, message },
    authHeaders()
  );
}

export function withdrawApplication(podId: string, roleId: string) {
  return api.delete(`/pods/${podId}/role/${roleId}/applications`, authHeaders());
}

export function acceptApplicant(podId: string, roleId: string, applicantId: string) {
  return api.post(
    `/pods/${podId}/role/${roleId}/accept`,
    { userId: applicantId },
    authHeaders()
  );
}

export function rejectApplicant(podId: string, roleId: string, applicantId: string) {
  return api.post(
    `/pods/${podId}/role/${roleId}/reject`,
    { userId: applicantId },
    authHeaders()
  );
}

export function inviteUserToPod(podId: string, userId: string) {
  return api.post(
    `/pods/${podId}/invite`,
    { userId },
    authHeaders()
  );
}

export function removeMember(podId: string, memberId: string) {
  return api.delete(`/pods/${podId}/members/${memberId}`, authHeaders());
}
