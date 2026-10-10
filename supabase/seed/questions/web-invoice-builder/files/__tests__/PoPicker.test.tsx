import { act, fireEvent, flushPromises, render, screen } from '@codearena/test-utils';
import React from 'react';
import { InvoiceBuilder } from '../src/InvoiceBuilder';
import { SEARCH_DEBOUNCE_MS } from '../src/components/PoPicker';
import { createFakeApi, typeInto } from './support/fakeApi';

describe('PO search', () => {
  it('sends one request when the supplier pauses typing', async () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);

    for (const value of ['P', 'PO', 'PO-', 'PO-2', 'PO-20']) typeInto('po-search', value);
    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(api.searchPos).toHaveBeenCalledTimes(1);
    expect(api.searchPos).toHaveBeenCalledWith('PO-20');
    await flushPromises(); // let the results render
  });

  it('waits for the pause before searching', async () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);

    typeInto('po-search', 'Pune');
    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    expect(api.searchPos).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(api.searchPos).toHaveBeenCalledWith('Pune');
    await flushPromises();
  });

  it('lists matches; choosing one imports its lines', async () => {
    jest.useFakeTimers();
    const api = createFakeApi();
    render(<InvoiceBuilder api={api} />);

    typeInto('po-search', 'mumbai');
    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    await flushPromises();
    fireEvent.click(screen.getByTestId('po-po-2'));
    await flushPromises();

    expect(api.getPoLines).toHaveBeenCalledWith('po-2');
    expect(screen.getAllByTestId('line')).toHaveLength(3);
  });
});
