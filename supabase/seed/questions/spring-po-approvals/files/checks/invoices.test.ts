import { annotation, body, check, code, method } from './support/java';

const { matcher, controller, orders, service } = code;
const match = body(method(matcher, 'match'));

describe('invoice matching', () => {
  it('amounts are compared by value, whatever their scale (1500.0 = 1500.00)', () => {
    const scaleSensitive =
      /(getTotal|getUnitPrice|amount|unitPrice)\(\)\s*\.equals\(/.test(match) ||
      /\.equals\(\s*[\w.]*(getTotal|getUnitPrice|amount|unitPrice)\(\)\s*\)/.test(match);
    check(!scaleSensitive && /compareTo\s*\(/.test(match), 'Looked at InvoiceMatcher.match().');
  });

  it('quantities of a SKU split over several invoice lines are added up', () => {
    check(
      /\.merge\(|groupingBy|summingInt|summingLong|getOrDefault\(|\.sum\(\)|\+=/.test(match),
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
