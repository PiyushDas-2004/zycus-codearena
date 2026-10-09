/**
 * Candidate access codes: 12 characters of Crockford Base32 (60 bits of entropy), shown as XXXX-XXXX-XXXX.
 * Crockford's alphabet omits I, L, O and U so codes survive being read aloud or retyped.
 * The database (private.normalize_access_code) applies the same normalization before hashing.
 *
 * This module is shared by the browser app and Node scripts, so it must stay dependency-free.
 */
export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ACCESS_CODE_LENGTH = 12;

/** Uppercases, strips separators and maps look-alike letters (O→0, I/L→1). Returns '' for junk. */
export function normalizeAccessCode(input: string): string {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s\-_.]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return /^[0-9A-HJKMNP-TV-Z]*$/.test(cleaned) ? cleaned : '';
}

export function isValidAccessCode(input: string): boolean {
  return normalizeAccessCode(input).length === ACCESS_CODE_LENGTH;
}

/** Formats progressively while typing: "abcd1234" → "ABCD-1234". */
export function formatAccessCode(input: string): string {
  const n = normalizeAccessCode(input).slice(0, ACCESS_CODE_LENGTH);
  return n.match(/.{1,4}/g)?.join('-') ?? '';
}
