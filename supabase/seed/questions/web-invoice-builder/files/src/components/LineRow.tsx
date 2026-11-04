import type { GstRate, InvoiceLine, PoLine } from '../types';
import { formatPaise, lineNet } from '../utils/money';
import { MoneyInput } from './MoneyInput';

const GST_RATES: GstRate[] = [0, 5, 12, 18, 28];

interface Props {
  /** 1-based position on the invoice (labels and test ids). */
  position: number;
  line: InvoiceLine;
  onChange(patch: Partial<PoLine>): void;
  onRemove(): void;
}

export function LineRow({ position, line, onChange, onRemove }: Props) {
  return (
    <div data-testid="line" role="group" aria-label={`Line ${position}`} className="line">
      <input
        data-testid={`sku-${position}`}
        aria-label="SKU"
        value={line.sku}
        onChange={(e) => onChange({ sku: e.target.value })}
      />
      <input
        data-testid={`description-${position}`}
        aria-label="Description"
        value={line.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <input
        data-testid={`qty-${position}`}
        aria-label="Quantity"
        type="number"
        min={0}
        value={line.quantity}
        onChange={(e) => onChange({ quantity: Number(e.target.value) })}
      />
      <MoneyInput
        testID={`price-${position}`}
        label="Unit price"
        paise={line.unitPricePaise}
        onChange={(unitPricePaise) => onChange({ unitPricePaise })}
      />
      <select
        data-testid={`gst-${position}`}
        aria-label="GST rate"
        value={line.gstRate}
        onChange={(e) => onChange({ gstRate: Number(e.target.value) as GstRate })}
      >
        {GST_RATES.map((rate) => (
          <option key={rate} value={rate}>
            {rate}%
          </option>
        ))}
      </select>
      <span data-testid={`total-${position}`}>{formatPaise(lineNet(line))}</span>
      <button type="button" data-testid={`remove-${position}`} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}
