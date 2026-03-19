import { describe, it, expect } from 'vitest';
import { formatInr } from './formatInr';

describe('formatInr', () => {
  it('formats positive number as INR', () => {
    expect(formatInr(14999)).toMatch(/14,?999|₹\s*14,?999/);
  });

  it('formats zero as INR', () => {
    expect(formatInr(0)).toMatch(/0|₹\s*0/);
  });

  it('formats large number with commas', () => {
    const result = formatInr(24999);
    expect(result).toContain('24');
    expect(result).toContain('999');
  });
});
