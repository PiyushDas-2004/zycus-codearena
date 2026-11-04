import { act, fireEvent, flushPromises, render, screen } from '@codearena/test-utils';
import React from 'react';
import { InvoiceBuilder } from '../../src/InvoiceBuilder';
import { SEARCH_DEBOUNCE_MS } from '../../src/components/PoPicker';
import type { InvoiceApi, InvoiceDraft, PoLine, PoSummary } from '../../src/types';

export const POS: PoSummary[] = [
  { id: 'po-1', number: 'PO-2026-0042', buyer: 'Zycus Pune' },
  { id: 'po-2', number: 'PO-2026-0043', buyer: 'Zycus Mumbai' },
];

/** Net ₹9,998.00, GST ₹1,649.64, total ₹11,647.64. */
export const PO_LINES: PoLine[] = [
  { sku: 'SKU-A', description: 'Copier paper A4', quantity: 10, unitPricePaise: 25_000, gstRate: 12 },
  { sku: 'SKU-B', description: 'Toner cartridge', quantity: 2, unitPricePaise: 349_900, gstRate: 18 },
  { sku: 'SKU-C', description: 'Delivery', quantity: 1, unitPricePaise: 50_000, gstRate: 18 },
];

/** The API, recording calls in order. Drafts are copied when they are sent, as the network would. */
export function createFakeApi() {
  const log: string[] = [];
  const saved: InvoiceDraft[] = [];
  const submitted: InvoiceDraft[] = [];
  const api = {
    log,
    saved,
    submitted,
    searchPos: jest.fn(async (query: string) => {
      log.push(`search:${query}`);
      const q = query.toLowerCase();
      return POS.filter((po) => po.number.toLowerCase().includes(q) || po.buyer.toLowerCase().includes(q));
    }),
    getPoLines: jest.fn(async (poId: string) => {
      log.push(`lines:${poId}`);
      return PO_LINES.map((line) => ({ ...line }));
    }),
    saveDraft: jest.fn(async (draft: InvoiceDraft) => {
      log.push('save');
      saved.push(structuredClone(draft));
    }),
    submit: jest.fn(async (draft: InvoiceDraft) => {
      log.push('submit');
      submitted.push(structuredClone(draft));
    }),
  } satisfies InvoiceApi & Record<string, unknown>;
  return api;
}

export type FakeApi = ReturnType<typeof createFakeApi>;

/** Renders the builder with fake timers, finds PO-2026-0042 and imports its lines. */
export async function openPo(api: FakeApi = createFakeApi()) {
  jest.useFakeTimers();
  const utils = render(<InvoiceBuilder api={api} />);
  fireEvent.change(screen.getByTestId('po-search'), { target: { value: '0042' } });
  act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
  await flushPromises();
  fireEvent.click(screen.getByTestId('po-po-1'));
  await flushPromises();
  return { api, ...utils };
}

/** Types into an input (a change event with the new text). */
export function typeInto(testId: string, value: string) {
  fireEvent.change(screen.getByTestId(testId), { target: { value } });
}

export const valueOf = (testId: string): unknown => screen.getByTestId(testId).props.value;
