export type ExpiryStatus = "expired" | "today" | "soon" | null;

function daysUntil(expiresAt: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiresAt}T00:00:00`);
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000);
}

/** Status of a pantry item relative to today, for the fridge's expiry badge. */
export function getExpiryStatus(
  expiresAt: string | null,
  withinDays = 2,
): ExpiryStatus {
  if (!expiresAt) return null;
  const diff = daysUntil(expiresAt);
  if (diff < 0) return "expired";
  if (diff === 0) return "today";
  if (diff <= withinDays) return "soon";
  return null;
}

/** Short label for the badge, e.g. "Expired", "Today", "2d left". */
export function expiryLabel(expiresAt: string): string {
  const diff = daysUntil(expiresAt);
  if (diff < 0) return "Expired";
  if (diff === 0) return "Today";
  return `${diff}d left`;
}
