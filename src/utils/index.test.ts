//src//utils//index.test.ts
import { describe, expect, it } from 'vitest';
import { calculateEMI, formatNumber, roundTo } from './index';

describe('calculator utilities', () => {
  it('formats large numbers with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('rounds numbers to the requested precision', () => {
    expect(roundTo(3.14159, 2)).toBe('3.14');
  });

  it('calculates monthly EMI for a standard loan', () => {
    const result = calculateEMI(100000, 12, 12);
    expect(result.monthlyEMI).toBeCloseTo(8884.88, 2);
    expect(result.totalPayment).toBeCloseTo(106618.55, 2);
  });
});
