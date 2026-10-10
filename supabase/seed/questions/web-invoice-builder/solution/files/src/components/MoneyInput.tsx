import { useState } from 'react';
import { parseRupees } from '../utils/money';

interface Props {
  testID: string;
  label: string;
  paise: number;
  onChange(paise: number): void;
}

const asText = (paise: number) => (paise / 100).toFixed(2);

/**
 * A rupee amount field. The value lives in the parent, in paise.
 *
 * While the supplier types, the field shows their text: "12." or "" aren't amounts yet, and
 * rendering the parsed number back ("12", "0") ate the decimal point and refilled a cleared
 * field. Valid text updates the parent; outside the edit (blur, undo, import) the field follows
 * the parent's value.
 */
export function MoneyInput({ testID, label, paise, onChange }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && parseRupees(draft) === null;

  return (
    <input
      data-testid={testID}
      aria-label={label}
      aria-invalid={invalid}
      inputMode="decimal"
      value={draft ?? asText(paise)}
      onChange={(e) => {
        setDraft(e.target.value);
        const next = parseRupees(e.target.value);
        if (next !== null) onChange(next);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
