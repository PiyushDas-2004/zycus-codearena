import {
  annotation,
  body,
  check,
  code,
  helpersOf,
  method,
  noStrings,
  templatesOf,
  usesTemplate,
  withHelpers,
} from './support/java';

const { matcher, controller, orders, service } = code;
const matchMethod = method(matcher, 'match');
/** match() with its helpers written in, string contents blanked. */
const match = noStrings(withHelpers(matcher, matchMethod));

describe('invoice matching', () => {
  it('amounts are compared by value, whatever their scale (1500.0 = 1500.00)', () => {
    const amount = '[\\w.]*(getTotal|getUnitPrice|amount|unitPrice)\\(\\)';
    // BigDecimal.equals compares the scale too: a.equals(b), b.equals(a), Objects.equals(a, b),
    // also in a helper that takes BigDecimals.
    const scaleSensitive =
      new RegExp(`${amount}\\s*\\.equals\\(`).test(match) ||
      new RegExp(`\\.equals\\(\\s*${amount}\\s*\\)`).test(match) ||
      new RegExp(`Objects\\.equals\\(\\s*(${amount}|[^,;]*,\\s*${amount})`).test(match) ||
      helpersOf(matcher, matchMethod).some((m) =>
        m.params
          .filter((p) => /\bBigDecimal\b/.test(p.type))
          .some((p) =>
            new RegExp(
              `\\b${p.name}\\s*\\.equals\\(|\\.equals\\(\\s*${p.name}\\s*\\)|Objects\\.equals\\([^;]*\\b${p.name}\\b`,
            ).test(noStrings(body(m))),
          ),
      );
    const byValue =
      /compareTo\s*\(/.test(match) ||
      /stripTrailingZeros\(\)\s*\.equals\([^;]*stripTrailingZeros\(\)/.test(match) ||
      /\.subtract\([^;]*\)\s*\.signum\(\)/.test(match);
    check(!scaleSensitive && byValue, 'Looked at InvoiceMatcher.match() and its helpers.');
  });

  it('quantities of a SKU split over several invoice lines are added up', () => {
    // Summed per SKU: the statement that adds up quantities is keyed or filtered by SKU.
    const summing =
      /\.merge\(|\.compute(IfPresent|IfAbsent)?\(|groupingBy|summingInt|summingLong|getOrDefault\(|\.sum\(\)|\+=|\.reduce\(|toMap\([^;]*(::sum|::addExact|->\s*\w+\s*\+\s*\w+)/;
    check(
      match.split(';').some((statement) => summing.test(statement) && /sku/i.test(statement)),
      'Looked at how InvoiceMatcher.match() checks invoiced quantities.',
    );
  });

  it("matching an invoice loads the PO's lines (open-in-view is off)", () => {
    const m = method(controller, 'matchInvoice');
    const b = noStrings(withHelpers(controller, m));
    const fetchesLines = orders.methods
      .filter((r) => annotation(r, 'EntityGraph') || /join\s+fetch/i.test(annotation(r, 'Query')?.text ?? ''))
      .some((r) => new RegExp(`\\.\\s*${r.name}\\s*\\(`).test(b));
    const serviceField = controller.fields.find((f) => f.type === service.name)?.name;
    const viaService = !!serviceField && new RegExp(`\\b${serviceField}\\s*\\.\\s*\\w+\\s*\\(`).test(b);
    const transactional = !!annotation(m, 'Transactional') || !!annotation(controller, 'Transactional');
    const inTemplate = templatesOf(controller).some((t) => usesTemplate(b, t));
    check(
      fetchesLines || viaService || transactional || inTemplate,
      'Looked at PurchaseOrderController.matchInvoice().',
    );
  });
});
