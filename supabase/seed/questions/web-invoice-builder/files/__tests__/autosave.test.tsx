import { act, fireEvent, flushPromises, render, screen } from '@codearena/test-utils';
import React from 'react';
import { AUTOSAVE_MS, InvoiceBuilder } from '../src/InvoiceBuilder';
import { createFakeApi, openPo, typeInto } from './support/fakeApi';

describe('autosave', () => {
  it('saves the current draft once the supplier stops editing', async () => {
    const { api } = await openPo();

    act(() => jest.advanceTimersByTime(AUTOSAVE_MS - 1));
    expect(api.saved).toHaveLength(0);
    act(() => jest.advanceTimersByTime(1));

    expect(api.saved).toHaveLength(1);
    expect(api.saved[0]!.poId).toBe('po-1');
    expect(api.saved[0]!.lines.map((l) => l.sku)).toEqual(['SKU-A', 'SKU-B', 'SKU-C']);
  });

  it('saves quantity edits, once per burst of typing, with the latest values', async () => {
    const { api } = await openPo();
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS));
    const before = api.saved.length;

    typeInto('qty-1', '4');
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS / 2));
    typeInto('qty-2', '3');
    act(() => jest.advanceTimersByTime(AUTOSAVE_MS));

    expect(api.saved.length - before).toBe(1);
    expect(api.saved[api.saved.length - 1]!.lines.map((l) => l.quantity)).toEqual([4, 3, 1]);
  });

  it('never saves after the invoice is submitted', async () => {
    const { api } = await openPo();
    typeInto('qty-1', '4');

    fireEvent.submit(screen.getByTestId('invoice'));
    await flushPromises();
    act(() => jest.advanceTimersByTime(5_000));

    expect(api.submitted).toHaveLength(1);
    expect(api.submitted[0]!.lines[0]!.quantity).toBe(4);
    expect(api.log.slice(api.log.indexOf('submit'))).toEqual(['submit']);
  });

  it('never saves after the builder is closed', async () => {
    const { api, unmount } = await openPo();
    typeInto('qty-1', '4');

    unmount();
    act(() => jest.advanceTimersByTime(5_000));

    expect(api.saveDraft).not.toHaveBeenCalled();
  });

  it('does not save before a PO is chosen', () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);
    act(() => jest.advanceTimersByTime(5_000));
    expect(api.saveDraft).not.toHaveBeenCalled();
  });
});
