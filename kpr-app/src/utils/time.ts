const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function toDate(value?: string | number | Date): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeTime(value?: string | number | Date): string {
  const date = toDate(value);
  if (!date) return "";

  const diff = Date.now() - date.getTime();
  if (diff < SECOND) return "just now";

  if (diff < MINUTE) {
    const seconds = Math.floor(diff / SECOND);
    return `${seconds}s ago`;
  }

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes}m ago`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours}h ago`;
  }

  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}
