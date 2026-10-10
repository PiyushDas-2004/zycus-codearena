import { useState } from 'react';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import type { InvoiceApi, PoSummary } from '../types';

export const SEARCH_DEBOUNCE_MS = 300;

interface Props {
  api: InvoiceApi;
  onSelect(po: PoSummary): void;
}

/** Typeahead: searches POs by number or buyer once the supplier pauses typing. */
export function PoPicker({ api, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PoSummary[]>([]);

  // `search` is a new function on every render, so useMemo(() => debounce(search), [search])
  // built a new debounce (with its own timer) per keystroke: every keystroke searched. The hook
  // keeps one debounced function for the component's lifetime.
  const debouncedSearch = useDebouncedCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then(setResults);
  }, SEARCH_DEBOUNCE_MS);

  return (
    <div className="po-picker">
      <input
        data-testid="po-search"
        aria-label="Purchase order"
        placeholder="Search PO number or buyer"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
      />
      <ul role="listbox">
        {results.map((po) => (
          <li key={po.id} role="option" aria-selected={false}>
            <button
              type="button"
              data-testid={`po-${po.id}`}
              onClick={() => {
                setResults([]);
                setQuery(po.number);
                onSelect(po);
              }}
            >
              {po.number} · {po.buyer}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
