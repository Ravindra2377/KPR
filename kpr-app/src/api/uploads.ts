import api from "./client";

const authHeaders = () => ({ Authorization: `Bearer ${globalThis.__KPR_TOKEN}` });

export const deletePortfolioItem = (id: string) =>
  api.delete(`/profile/portfolio/${id}`, { headers: authHeaders() });

export const reorderPortfolio = (order: string[]) =>
  api.post("/profile/portfolio/reorder", { order }, { headers: authHeaders() });
