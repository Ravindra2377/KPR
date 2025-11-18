const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const APPLY_LIMIT = 3;
const INVITE_LIMIT = 5;

type RateEntry = { hits: number; resetAt: number };
const rateBuckets: Record<string, RateEntry> = {};

const keyFor = (userId: string, podId: string, action: "apply" | "invite") => `${action}:${userId}:${podId}`;

const canTakeAction = (userId: string, podId: string, action: "apply" | "invite", limit: number, windowMs: number) => {
  const key = keyFor(userId, podId, action);
  const now = Date.now();
  const current = rateBuckets[key];
  if (!current || now >= current.resetAt) {
    rateBuckets[key] = { hits: 1, resetAt: now + windowMs };
    return true;
  }
  if (current.hits >= limit) {
    return false;
  }
  current.hits += 1;
  return true;
};

export const canApplyToPod = (userId: string, podId: string) =>
  canTakeAction(userId, podId, "apply", APPLY_LIMIT, WINDOW_MS);

export const canInviteToPod = (userId: string, podId: string) =>
  canTakeAction(userId, podId, "invite", INVITE_LIMIT, WINDOW_MS);
