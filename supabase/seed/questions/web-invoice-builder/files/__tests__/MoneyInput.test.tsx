import { fireEvent, screen, textContent } from '@codearena/test-utils';
import { parseRupees } from '../src/utils/money';
import { openPo, typeInto, valueOf } from './support/fakeApi';

const lineTotal = () => textContent(screen.getByTestId('total-1'));

describe('price field', () => {
  it('keeps the decimal point while the supplier types ₹12.50', async () => {
    await openPo();

    typeInto('price-1', '12.');
    expect(valueOf('price-1')).toBe('12.');
    typeInto('price-1', '12.5');

    expect(valueOf('price-1')).toBe('12.5');
    expect(lineTotal()).toBe('₹125.00');
  });

  it('shows exactly what was typed while typing (₹12.0, ₹0.05)', async () => {
    await openPo();

    typeInto('price-1', '12.0');
    expect(valueOf('price-1')).toBe('12.0');
    for (const text of ['0', '0.', '0.0', '0.05']) {
      typeInto('price-1', text);
      expect(valueOf('price-1')).toBe(text);
    }
    expect(lineTotal()).toBe('₹0.50');
  });

  it('shows the restored price after Undo', async () => {
    await openPo();

    typeInto('price-1', '99');
    const price = screen.getByTestId('price-1');
    if (price.props.onBlur) fireEvent(price, 'blur', { target: { value: '99' } }); // the field is left
    fireEvent.click(screen.getByTestId('undo'));

    expect(parseRupees(String(valueOf('price-1')))).toBe(25_000);
    expect(lineTotal()).toBe('₹2,500.00');
  });

  it('can be cleared and typed again', async () => {
    await openPo();

    typeInto('price-1', '');
    expect(valueOf('price-1')).toBe('');
    typeInto('price-1', '99');

    expect(valueOf('price-1')).toBe('99');
    expect(lineTotal()).toBe('₹990.00');
  });

  it('accepts a pasted amount with digit grouping', async () => {
    await openPo();

    typeInto('price-1', '1,250.50');

    expect(lineTotal()).toBe('₹12,505.00');
  });
});

describe('parseRupees', () => {
  it('reads plain, grouped and ₹ amounts', () => {
    expect(parseRupees('1250')).toBe(125_000);
    expect(parseRupees('99.9')).toBe(9_990);
    expect(parseRupees('0.29')).toBe(29);
    expect(parseRupees('1,250.50')).toBe(125_050);
    expect(parseRupees('₹ 1,23,456')).toBe(12_345_600);
    expect(parseRupees(' 12.5 ')).toBe(1_250);
  });

  it('rejects anything that is not a valid amount', () => {
    for (const text of ['', '.', 'abc', '12abc', '1.005', '-5', '1.2.3', '1e3', '0x10', 'Infinity']) {
      expect([text, parseRupees(text)]).toEqual([text, null]);
    }
  });
});
