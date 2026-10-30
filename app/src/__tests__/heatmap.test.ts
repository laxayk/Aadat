import { describe, expect, it } from 'vitest';
import { monthGrid } from '../heatmap';

describe('monthGrid', () => {
  it('lays October 2026 out Monday-first with correct length', () => {
    const cells = monthGrid('2026-10', ['2026-10-05', '2026-10-06']);
    // 1 Oct 2026 is a Thursday: 3 leading blanks, then 31 days
    const real = cells.filter((c) => c.date !== null);
    expect(real).toHaveLength(31);
    expect(cells[3].date).toBe('2026-10-01');
    expect(cells[3 + 4].done).toBe(true); // 5th
    expect(cells[3 + 5].done).toBe(true); // 6th
    expect(cells[3 + 6].done).toBe(false);
  });

  it('marks nothing when no days are done', () => {
    expect(monthGrid('2026-02', []).filter((c) => c.done)).toHaveLength(0);
  });
});
