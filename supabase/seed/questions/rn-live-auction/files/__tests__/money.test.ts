import { formatRupees, isValidBid, parseRupees } from '../src/utils/money';

describe('bid rules', () => {
  it('accepts a bid that undercuts the best bid by at least the minimum decrement', () => {
    // [bid, best, min decrement, valid?]
    const cases: [number, number, number, boolean][] = [
      [999.95, 1000.05, 0.1, true],
      [999.94, 1000.05, 0.1, true],
      [999.96, 1000.05, 0.1, false],
      [0.2, 0.3, 0.1, true],
      [0.21, 0.3, 0.1, false],
      [1234.5, 1234.6, 0.1, true],
    ];
    for (const [bid, best, dec, valid] of cases) {
      expect(`${bid} against ${best}: ${isValidBid(bid, best, dec)}`).toBe(`${bid} against ${best}: ${valid}`);
    }
  });

  it('rejects zero, negative and non-numeric amounts', () => {
    expect(parseRupees('0')).toBeNull();
    expect(parseRupees('-5')).toBeNull();
    expect(parseRupees('abc')).toBeNull();
    expect(parseRupees('1,000.05')).toBe(1000.05);
    expect(isValidBid(0, 10, 0.1)).toBe(false);
  });

  it('formats amounts in rupees with Indian digit grouping', () => {
    expect(formatRupees(1234567.5)).toBe('₹12,34,567.50');
    expect(formatRupees(0.1 + 0.2)).toBe('₹0.30');
    expect(formatRupees(999.95)).toBe('₹999.95');
  });
});
