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
  if (params.roles?.length) {
    payload.roles = params.roles.join(",");
  }
  if (params.visibility) {
    payload.visibility = params.visibility;
  }
  return payload;
};

export function fetchPodsDiscover(params?: PodFilterOptions) {
  return api.get<DiscoverResponse>("/pods/discover", { params: buildParams(params) });
}

export function fetchPod(podId: string) {
  return api.get<Pod>(`/pods/${podId}`, authHeaders());
}

export function createPod(payload: Partial<Pod>) {
  return api.post<Pod>("/pods", payload, authHeaders());
}

export function applyToPod(podId: string, roleName: string, message?: string) {
  return api.post(
    `/pods/${podId}/apply`,
    { roleName, message },
    authHeaders()
  );
}

export function approveApplicant(podId: string, applicantId: string) {
  return api.post(`/pods/${podId}/applicants/${applicantId}/approve`, null, authHeaders());
}

export function rejectApplicant(podId: string, applicantId: string, body?: any) {
  return api.post(`/pods/${podId}/applicants/${applicantId}/reject`, body, authHeaders());
}

export function inviteUserToPod(podId: string, userId: string, roleName?: string) {
  return api.post(`/pods/${podId}/invite`, { userId, roleName }, authHeaders());
}

export function ownerPods() {
  return api.get("/pods/owner", authHeaders());
}

export function removeMember(podId: string, memberId: string) {
  return api.post(`/pods/${podId}/members/${memberId}/remove`, null, authHeaders());
}
