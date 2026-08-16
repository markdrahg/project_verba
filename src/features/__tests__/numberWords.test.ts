import { describe, it, expect } from 'vitest';
import { parseSpokenNumber } from '../numberWords';

describe('parseSpokenNumber', () => {
  it('parses digit strings', () => {
    expect(parseSpokenNumber('2')).toBe(2);
    expect(parseSpokenNumber('17')).toBe(17);
  });

  it('parses number words', () => {
    expect(parseSpokenNumber('two')).toBe(2);
    expect(parseSpokenNumber('seventeen')).toBe(17);
    expect(parseSpokenNumber('zero')).toBe(0);
  });

  it('is case-insensitive and tolerates surrounding whitespace', () => {
    expect(parseSpokenNumber('  Two ')).toBe(2);
    expect(parseSpokenNumber('TWELVE')).toBe(12);
  });

  it('returns null for words outside the supported range', () => {
    expect(parseSpokenNumber('twenty one')).toBeNull();
    expect(parseSpokenNumber('a hundred')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parseSpokenNumber('paragraph')).toBeNull();
    expect(parseSpokenNumber('')).toBeNull();
  });
});
