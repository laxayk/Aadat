/**
 * Month heatmap grid: 7 columns (Mon..Sun), one cell per day, leading blanks
 * so the 1st lands under its real weekday.
 */
export interface HeatCell {
  date: string | null; // yyyy-mm-dd or a leading blank
  done: boolean;
}

export function monthGrid(month: string, doneDays: string[]): HeatCell[] {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const done = new Set(doneDays);
  const cells: HeatCell[] = [];
  // Monday-first offset: JS getDay() is Sunday-first.
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null, done: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date, done: done.has(date) });
  }
  return cells;
}
