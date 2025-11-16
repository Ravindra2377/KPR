import api from "../api/client";

export async function getCollaborators(userId: string) {
  const token = (globalThis as any).__KPR_TOKEN;
  if (!token) return [];
  const res = await api.get(`/users/${userId}/collaborators`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data || [];
}
