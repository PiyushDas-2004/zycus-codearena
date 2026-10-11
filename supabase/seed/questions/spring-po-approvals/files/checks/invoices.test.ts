import { annotation, body, check, code, method } from './support/java';

const { matcher, controller, orders, service } = code;
const match = body(method(matcher, 'match'));

describe('invoice matching', () => {
  it('amounts are compared by value, whatever their scale (1500.0 = 1500.00)', () => {
    const amount = '[\\w.]*(getTotal|getUnitPrice|amount|unitPrice)\\(\\)';
    // BigDecimal.equals compares the scale too: a.equals(b), b.equals(a), Objects.equals(a, b).
    const scaleSensitive =
      new RegExp(`${amount}\\s*\\.equals\\(`).test(match) ||
      new RegExp(`\\.equals\\(\\s*${amount}\\s*\\)`).test(match) ||
      new RegExp(`Objects\\.equals\\(\\s*(${amount}|[^,;]*,\\s*${amount})`).test(match);
    const byValue =
      /compareTo\s*\(/.test(match) ||
      /stripTrailingZeros\(\)\s*\.equals\([^;]*stripTrailingZeros\(\)/.test(match) ||
      /\.subtract\([^;]*\)\s*\.signum\(\)/.test(match);
    check(!scaleSensitive && byValue, 'Looked at InvoiceMatcher.match().');
  });

  it('quantities of a SKU split over several invoice lines are added up', () => {
    check(
      /\.merge\(|\.compute(IfPresent)?\(|groupingBy|summingInt|summingLong|getOrDefault\(|\.sum\(\)|\+=|\.reduce\(|toMap\([^;]*(::sum|::addExact|->\s*\w+\s*\+\s*\w+)/.test(
        match,
      ),
      'Looked at how InvoiceMatcher.match() checks invoiced quantities.',
    );
  });

  it("matching an invoice loads the PO's lines (open-in-view is off)", () => {
    const m = method(controller, 'matchInvoice');
    const b = body(m);
    const fetchesLines = orders.methods
      .filter((r) => annotation(r, 'EntityGraph') || /join\s+fetch/i.test(annotation(r, 'Query')?.text ?? ''))
      .some((r) => new RegExp(`\\.\\s*${r.name}\\s*\\(`).test(b));
    const serviceField = controller.fields.find((f) => f.type === service.name)?.name;
    const viaService = !!serviceField && new RegExp(`\\b${serviceField}\\s*\\.\\s*\\w+\\s*\\(`).test(b);
    const transactional = !!annotation(m, 'Transactional') || !!annotation(controller, 'Transactional');
    check(fetchesLines || viaService || transactional, 'Looked at PurchaseOrderController.matchInvoice().');
  });
});
