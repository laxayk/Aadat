/**
 * Streak logic, server side. Dates are the user's local calendar days
 * (yyyy-mm-dd). The client sends its own "today" so the server never guesses
 * the user's time zone from its own clock.
 */

export function parseDay(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function dayString(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

const DAY = 24 * 3600 * 1000;

/**
 * Current streak: consecutive completed days ending today; if today is not
 * done yet, a streak ending yesterday still counts (the day is not over).
 */
export function currentStreak(doneDays: string[], today: string): number {
  const done = new Set(doneDays.map(parseDay));
  let cursor = parseDay(today);
  if (!done.has(cursor)) cursor -= DAY;
  let streak = 0;
  while (done.has(cursor)) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

/** Longest run of consecutive completed days ever. */
export function bestStreak(doneDays: string[]): number {
  const sorted = doneDays.map(parseDay).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -2 * DAY;
  for (const d of sorted) {
    run = d === prev + DAY ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
