import { describe, it, expect } from 'vitest';
import { emptyCounts, calcTotal, calcChange, countsToParts, addCounts, subCounts, DENOMS } from './denominations';

describe('emptyCounts', () => {
  it('creates counts with all denominations at 0', () => {
    const c = emptyCounts();
    for (const d of DENOMS) {
      expect(c[d.value]).toBe(0);
    }
  });
});

describe('calcTotal', () => {
  it('returns 0 for empty counts', () => {
    expect(calcTotal(emptyCounts())).toBe(0);
  });

  it('sums denomination values correctly', () => {
    const c = { ...emptyCounts(), 100: 2, 50: 1, 10: 3 };
    expect(calcTotal(c)).toBe(100 * 2 + 50 * 1 + 10 * 3);
  });
});

describe('calcChange', () => {
  it('returns change when received > due', () => {
    const r = calcChange(500, 350);
    expect(r).toEqual({ change: 150, short: 0 });
  });

  it('returns short when received < due', () => {
    const r = calcChange(200, 350);
    expect(r).toEqual({ change: 0, short: 150 });
  });

  it('returns zero change when exact', () => {
    const r = calcChange(350, 350);
    expect(r).toEqual({ change: 0, short: 0 });
  });
});

describe('countsToParts', () => {
  it('formats non-zero counts', () => {
    const c = { ...emptyCounts(), 500: 1, 100: 2 };
    const result = countsToParts(c);
    expect(result).toContain('1× $500');
    expect(result).toContain('2× $100');
  });

  it('returns empty string for empty counts', () => {
    expect(countsToParts(emptyCounts())).toBe('');
  });
});

describe('addCounts', () => {
  it('adds two count maps', () => {
    const a = { ...emptyCounts(), 100: 2, 50: 1 };
    const b = { ...emptyCounts(), 100: 1, 20: 3 };
    const r = addCounts(a, b);
    expect(r[100]).toBe(3);
    expect(r[50]).toBe(1);
    expect(r[20]).toBe(3);
  });
});

describe('subCounts', () => {
  it('subtracts without going negative', () => {
    const a = { ...emptyCounts(), 100: 5, 50: 1 };
    const b = { ...emptyCounts(), 100: 3, 50: 2 };
    const r = subCounts(a, b);
    expect(r[100]).toBe(2);
    expect(r[50]).toBe(0);
  });
});
