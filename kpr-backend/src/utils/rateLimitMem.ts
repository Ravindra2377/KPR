const perUserWindowMs = 10 * 60 * 1000; // 10 minutes
const perUserLimit = 3;
const cooldownMs = 2 * 60 * 1000; // 2 minutes between same pair

const perUserMap = new Map<string, number[]>();
const pairMap = new Map<string, number>();

export function canSendRequest(userId: string): boolean {
  const now = Date.now();
  const timestamps = perUserMap.get(userId) || [];
  const recent = timestamps.filter((ts) => now - ts < perUserWindowMs);

  if (recent.length >= perUserLimit) {
    perUserMap.set(userId, recent);
    return false;
  }

  recent.push(now);
  perUserMap.set(userId, recent);
  return true;
}

export function canSendToTarget(userId: string, targetId: string): boolean {
  const key = `${userId}:${targetId}`;
  const now = Date.now();
  const last = pairMap.get(key);

  if (last && now - last < cooldownMs) {
    return false;
  }

  pairMap.set(key, now);
  return true;
}
