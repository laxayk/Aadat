export interface Trackable {
  createdAt: string;
  doneDays: string[];
}

export const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** First day a habit is tracked: its created day, or an earlier recorded check-in if history was backfilled. */
export const startDay = (h: Trackable) => {
  const created = localDay(new Date(h.createdAt));
  const first = [...h.doneDays].sort()[0];
  return first && first < created ? first : created;
};

/** Monthly numbers for the month containing `today` (YYYY-MM-DD). Days before a habit's start are not counted. */
export function monthStats(list: Trackable[], today: string) {
  const monthKey = today.slice(0, 7);
  const monthStart = `${monthKey}-01`;
  const dayOfMonth = Number(today.slice(8));
  const startOf = (h: Trackable) => {
    const s = startDay(h);
    return s < monthStart ? monthStart : s > today ? today : s;
  };
  const tracked = list.reduce((n, h) => n + (dayOfMonth - Number(startOf(h).slice(8)) + 1), 0);
  const done = list.reduce(
    (n, h) => n + h.doneDays.filter((d) => d >= startOf(h) && d <= today && d.startsWith(monthKey)).length,
    0,
  );
  const perfectDays = Array.from({ length: dayOfMonth }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, '0')}`).filter((d) => {
    const active = list.filter((h) => startOf(h) <= d);
    return active.length > 0 && active.every((h) => h.doneDays.includes(d));
  }).length;
  return { tracked, done, rate: tracked ? done / tracked : 0, perfectDays, startOf };
}
