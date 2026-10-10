import { fireEvent, getConsoleErrors, screen, textContent } from '@codearena/test-utils';
import { initialState, invoiceReducer } from '../src/state/invoiceReducer';
import { PO_LINES, openPo, typeInto, valueOf } from './support/fakeApi';

const duplicateKeyWarnings = () => getConsoleErrors().filter((m) => /same key/i.test(m));
const gross = () => textContent(screen.getByTestId('total-gross'));

describe('invoice lines', () => {
  it('gives every line its own id, even when several are created at once', () => {
    jest.useFakeTimers();
    const imported = invoiceReducer(initialState, { type: 'importPoLines', lines: PO_LINES });
    const added = invoiceReducer(invoiceReducer(imported, { type: 'addLine' }), { type: 'addLine' });

    expect(new Set(added.lines.map((l) => l.id)).size).toBe(5);
  });

  it('edits only the line that was changed', async () => {
    await openPo();

    typeInto('qty-2', '7');

    expect([valueOf('qty-1'), valueOf('qty-2'), valueOf('qty-3')]).toEqual([10, 7, 1]);
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('removes only the line that was removed', async () => {
    await openPo();

    fireEvent.click(screen.getByTestId('remove-1'));

    expect(screen.getAllByTestId('line')).toHaveLength(2);
    expect(valueOf('sku-1')).toBe('SKU-B');
  });

  it('keeps lines that were added quickly apart', async () => {
    await openPo();

    fireEvent.click(screen.getByTestId('add-line'));
    fireEvent.click(screen.getByTestId('add-line'));
    typeInto('sku-5', 'SKU-Z');

    expect(screen.getAllByTestId('line')).toHaveLength(5);
    expect([valueOf('sku-1'), valueOf('sku-4'), valueOf('sku-5')]).toEqual(['SKU-A', '', 'SKU-Z']);
    expect(duplicateKeyWarnings()).toEqual([]);
  });
});

describe('totals and undo', () => {
  it('shows the totals of the imported PO', async () => {
    await openPo();

    expect(textContent(screen.getByTestId('total-net'))).toBe('₹9,998.00');
    expect(textContent(screen.getByTestId('total-tax'))).toBe('₹1,649.64');
    expect(gross()).toBe('₹11,647.64');
  });

  it('updates the totals on every edit', async () => {
    await openPo();

    typeInto('qty-1', '4');

    expect(textContent(screen.getByTestId('total-1'))).toBe('₹1,000.00');
    expect(gross()).toBe('₹9,967.64');
  });

  it('undo puts back the previous quantity and totals', async () => {
    await openPo();
    typeInto('qty-1', '4');

    fireEvent.click(screen.getByTestId('undo'));

    expect(valueOf('qty-1')).toBe(10);
    expect(gross()).toBe('₹11,647.64');
  });

  it('an edit never changes the version that Undo returns to', () => {
    jest.useFakeTimers();
    const imported = invoiceReducer(initialState, { type: 'importPoLines', lines: PO_LINES });
    const id = imported.lines[0]!.id;

    const edited = invoiceReducer(imported, { type: 'updateLine', id, patch: { quantity: 99 } });

    expect(imported.lines[0]!.quantity).toBe(10);
    expect(edited.lines[0]!.quantity).toBe(99);
    expect(edited.lines).not.toBe(imported.lines);
  });
});
