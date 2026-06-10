export const PREDICTION_LOCK_AT = new Date("2026-06-11T19:00:00.000Z");
export const PREDICTION_LOCK_LABEL = "June 11, 2026 at 3:00 PM ET";

export function predictionsLocked(now = new Date()): boolean {
  return now.getTime() >= PREDICTION_LOCK_AT.getTime();
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
