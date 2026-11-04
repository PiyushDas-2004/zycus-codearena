import { useEffect, useMemo, useReducer, useState } from 'react';
import { LineRow } from './components/LineRow';
import { PoPicker } from './components/PoPicker';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';
import { initialState, invoiceReducer, totals } from './state/invoiceReducer';
import type { InvoiceApi, InvoiceDraft, PoSummary } from './types';
import { todayInIndia } from './utils/dates';
import { formatPaise } from './utils/money';

export const AUTOSAVE_MS = 800;

export function InvoiceBuilder({ api }: { api: InvoiceApi }) {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);
  const [po, setPo] = useState<PoSummary | null>(null);
  const [invoiceDate] = useState(() => todayInIndia());
  const [status, setStatus] = useState<'draft' | 'submitting' | 'submitted'>('draft');

  const draft: InvoiceDraft = { poId: po?.id ?? null, invoiceDate, lines: state.lines };

  // Autosave 0.8 s after the last change.
  const autosave = useDebouncedCallback(() => {
    void api.saveDraft(draft);
  }, AUTOSAVE_MS);

  useEffect(() => {
    if (po) autosave();
  }, [po, state.lines, autosave]);

  const sums = useMemo(() => totals(state.lines), [state.lines]);

  async function choosePo(next: PoSummary) {
    setPo(next);
    dispatch({ type: 'importPoLines', lines: await api.getPoLines(next.id) });
  }

  async function submit() {
    setStatus('submitting');
    await api.submit(draft);
    setStatus('submitted');
  }

  return (
    <form
      data-testid="invoice"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <PoPicker api={api} onSelect={choosePo} />
      <p>
        Invoice date: <span data-testid="invoice-date">{invoiceDate}</span>
      </p>
      <fieldset disabled={status !== 'draft'}>
        {state.lines.map((line, i) => (
          <LineRow
            key={line.id}
            position={i + 1}
            line={line}
            onChange={(patch) => dispatch({ type: 'updateLine', id: line.id, patch })}
            onRemove={() => dispatch({ type: 'removeLine', id: line.id })}
          />
        ))}
        <button type="button" data-testid="add-line" onClick={() => dispatch({ type: 'addLine' })}>
          Add line
        </button>
        <button type="button" data-testid="undo" disabled={state.past.length === 0} onClick={() => dispatch({ type: 'undo' })}>
          Undo
        </button>
      </fieldset>
      <dl>
        <dt>Net</dt>
        <dd data-testid="total-net">{formatPaise(sums.net)}</dd>
        <dt>GST</dt>
        <dd data-testid="total-tax">{formatPaise(sums.tax)}</dd>
        <dt>Total</dt>
        <dd data-testid="total-gross">{formatPaise(sums.gross)}</dd>
      </dl>
      <button type="submit" data-testid="submit" disabled={status !== 'draft' || !po}>
        {status === 'submitted' ? 'Submitted' : 'Submit invoice'}
      </button>
    </form>
  );
}
