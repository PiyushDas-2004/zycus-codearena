import { parseRupees } from '../utils/money';

interface Props {
  testID: string;
  label: string;
  paise: number;
  onChange(paise: number): void;
}

/** A rupee amount field. The value lives in the parent, in paise. */
export function MoneyInput({ testID, label, paise, onChange }: Props) {
  return (
    <input
      data-testid={testID}
      aria-label={label}
      inputMode="decimal"
      value={(paise / 100).toString()}
      onChange={(e) => onChange(parseRupees(e.target.value) ?? 0)}
    />
  );
}
