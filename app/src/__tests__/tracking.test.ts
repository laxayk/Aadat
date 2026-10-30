import { describe, expect, it } from 'vitest';
import { monthStats } from '../tracking';

const h = (createdAt: string, doneDays: string[]) => ({ createdAt: `${createdAt}T09:00:00`, doneDays });

describe('monthStats denominator', () => {
  it('no habits or no check-ins gives 0, with the days since creation counted as misses', () => {
    expect(monthStats([], '2026-10-30').rate).toBe(0);
    const s = monthStats([h('2026-10-28', [])], '2026-10-30');
    expect(s.tracked).toBe(3);
    expect(s.done).toBe(0);
    expect(s.perfectDays).toBe(0);
  });
  it('days after creation but before the first check-in count as misses', () => {
    const s = monthStats([h('2026-10-20', ['2026-10-25', '2026-10-26'])], '2026-10-26');
    expect(s.tracked).toBe(7);
    expect(s.done).toBe(2);
    expect(s.perfectDays).toBe(2);
  });
  it('backfilled history before the created day is tracked from the earliest check-in', () => {
    const s = monthStats([h('2026-10-30', ['2026-10-27', '2026-10-28', '2026-10-30'])], '2026-10-30');
    expect(s.tracked).toBe(4);
    expect(s.done).toBe(3);
    expect(s.rate).toBeCloseTo(0.75);
  });
  it('is clamped to the 1st of the month', () => {
    const s = monthStats([h('2026-09-10', ['2026-09-20', '2026-10-01', '2026-10-02'])], '2026-10-03');
    expect(s.tracked).toBe(3);
    expect(s.done).toBe(2);
  });
  it('perfect days only need habits that already started', () => {
    const s = monthStats([h('2026-10-01', ['2026-10-01', '2026-10-02', '2026-10-03']), h('2026-10-03', ['2026-10-03'])], '2026-10-03');
    expect(s.perfectDays).toBe(3);
  });
});
