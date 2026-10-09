import { describe, expect, it } from 'vitest';
import { formatAccessCode, isValidAccessCode, normalizeAccessCode } from './accessCode';

describe('access codes', () => {
  it('normalizes case, separators and look-alike letters', () => {
    expect(normalizeAccessCode(' 7kq2-m9xd-4rta ')).toBe('7KQ2M9XD4RTA');
    expect(normalizeAccessCode('O0IL')).toBe('0011');
  });

  it('rejects characters outside Crockford base32', () => {
    expect(normalizeAccessCode('7KQ2-M9XD-4RTU')).toBe(''); // U is excluded
    expect(normalizeAccessCode('abc!')).toBe('');
  });

  it('validates the 12-character length', () => {
    expect(isValidAccessCode('7KQ2-M9XD-4RTA')).toBe(true);
    expect(isValidAccessCode('7KQ2-M9XD-4RT')).toBe(false);
  });

  it('formats progressively in groups of four', () => {
    expect(formatAccessCode('7kq2m')).toBe('7KQ2-M');
    expect(formatAccessCode('7kq2m9xd4rta99')).toBe('7KQ2-M9XD-4RTA');
  });
});
