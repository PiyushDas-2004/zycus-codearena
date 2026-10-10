import { render, screen, textContent } from '@codearena/test-utils';
import React from 'react';
import { InvoiceBuilder } from '../src/InvoiceBuilder';
import { todayInIndia } from '../src/utils/dates';
import { createFakeApi } from './support/fakeApi';

describe('invoice date (IST)', () => {
  it('is the Indian date just after midnight in India', () => {
    expect(todayInIndia(new Date('2026-03-31T18:30:00Z'))).toBe('2026-04-01'); // 00:00 IST
    expect(todayInIndia(new Date('2026-04-01T00:00:00Z'))).toBe('2026-04-01'); // 05:30 IST
  });

  it('is the Indian date late in the evening', () => {
    expect(todayInIndia(new Date('2026-03-31T18:29:59Z'))).toBe('2026-03-31'); // 23:59:59 IST
    expect(todayInIndia(new Date('2026-12-31T18:29:00Z'))).toBe('2026-12-31');
  });

  it('dates a new invoice with the date in India', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-30T19:00:00Z')); // 00:30 IST on 1 May
    render(<InvoiceBuilder api={createFakeApi()} />);

    expect(textContent(screen.getByTestId('invoice-date'))).toBe('2026-05-01');
  });
});
