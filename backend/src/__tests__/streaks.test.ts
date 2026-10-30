import { describe, expect, it } from 'vitest';
import { bestStreak, currentStreak } from '../streaks.js';

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-10-28', '2026-10-29', '2026-10-30'], '2026-10-30')).toBe(3);
  });

  it('keeps the streak when today is not done yet', () => {
    expect(currentStreak(['2026-10-28', '2026-10-29'], '2026-10-30')).toBe(2);
  });

  it('breaks on a missed day before today', () => {
    expect(currentStreak(['2026-10-27', '2026-10-28'], '2026-10-30')).toBe(0);
  });

  it('handles month boundaries', () => {
    expect(currentStreak(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2);
  });

  it('is zero with no completions', () => {
    expect(currentStreak([], '2026-10-30')).toBe(0);
  });
});

describe('bestStreak', () => {
  it('finds the longest run', () => {
    expect(bestStreak(['2026-10-01', '2026-10-02', '2026-10-10', '2026-10-11', '2026-10-12'])).toBe(3);
  });
});
