import { useMemo, useState } from 'react';
import type { InvoiceApi, PoSummary } from '../types';
import { debounce } from '../utils/debounce';

export const SEARCH_DEBOUNCE_MS = 300;

interface Props {
  api: InvoiceApi;
  onSelect(po: PoSummary): void;
}

/** Typeahead: searches POs by number or buyer once the supplier pauses typing. */
export function PoPicker({ api, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PoSummary[]>([]);

  const search = (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    void api.searchPos(q.trim()).then(setResults);
  };
  const debouncedSearch = useMemo(() => debounce(search, SEARCH_DEBOUNCE_MS), [search]);

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
