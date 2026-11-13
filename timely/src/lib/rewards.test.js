import { describe, expect, it } from 'vitest';
import { currentFocusStreak, levelProgress, totalPoints } from './rewards.js';

describe('reward calculations', () => {
  it('keeps the streak after one missed day, but not after two', () => {
    expect(currentFocusStreak('2026-11-03', new Set(['2026-11-01', '2026-11-03']))).toBe(2);
    expect(currentFocusStreak('2026-11-04', new Set(['2026-11-01', '2026-11-04']))).toBe(1);
  });

  it('uses a larger point requirement for each next level', () => {
    expect(levelProgress(170)).toEqual({ level: 2, progress: 0, required: 340 });
    expect(levelProgress(510)).toEqual({ level: 3, progress: 0, required: 510 });
  });

  it('derives the balance from the points log', () => {
    expect(totalPoints([{ amount: 1250 }, { amount: 15 }, { amount: 20 }])).toBe(1285);
  });
});
