import type { InvoiceLine, PoLine } from '../types';
import { lineNet, lineTax } from '../utils/money';

export interface InvoiceState {
  lines: InvoiceLine[];
  /** Earlier versions of `lines`, newest last, for Undo. */
  past: InvoiceLine[][];
}

export const initialState: InvoiceState = { lines: [], past: [] };

export type InvoiceAction =
  | { type: 'importPoLines'; lines: PoLine[] }
  | { type: 'addLine' }
  | { type: 'updateLine'; id: string; patch: Partial<PoLine> }
  | { type: 'removeLine'; id: string }
  | { type: 'undo' };

const BLANK_LINE: PoLine = { sku: '', description: '', quantity: 1, unitPricePaise: 0, gstRate: 18 };

const newLineId = () => `line-${Date.now()}`;

export function invoiceReducer(state: InvoiceState, action: InvoiceAction): InvoiceState {
  switch (action.type) {
    case 'importPoLines':
      return {
        lines: action.lines.map((line) => ({ ...line, id: newLineId() })),
        past: [...state.past, state.lines],
      };
    case 'addLine':
      return {
        lines: [...state.lines, { ...BLANK_LINE, id: newLineId() }],
        past: [...state.past, state.lines],
      };
    case 'updateLine': {
      const line = state.lines.find((l) => l.id === action.id);
      if (!line) return state;
      Object.assign(line, action.patch);
      return { lines: state.lines, past: [...state.past, state.lines] };
    }
    case 'removeLine':
      return {
        lines: state.lines.filter((l) => l.id !== action.id),
        past: [...state.past, state.lines],
      };
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return { lines: previous, past: state.past.slice(0, -1) };
    }
  }
}

export function totals(lines: InvoiceLine[]) {
  let net = 0;
  let tax = 0;
  for (const line of lines) {
    net += lineNet(line);
    tax += lineTax(line);
  }
  return { net, tax, gross: net + tax };
}
