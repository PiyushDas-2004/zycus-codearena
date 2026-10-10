import { annotation, body, check, code, method } from './support/java';

const { controller, orders, service } = code;
const list = method(controller, 'list');

describe('inbox paging', () => {
  it('page 1 is the first page', () => {
    check(/page\s*-\s*1/.test(body(list)) && /PageRequest\.of\s*\(/.test(body(list)), 'Looked at PurchaseOrderController.list().');
  });

  it('page 0 is refused', () => {
    check(
      /page\s*<\s*1|page\s*<=\s*0|1\s*>\s*page|0\s*>=\s*page/.test(body(list)) || /@Min\(\s*1\s*\)|@Positive\b/.test(list.text),
      'Looked at PurchaseOrderController.list().',
    );
  });

  it('the order is stable: newest first, ties broken by id', () => {
    const where = `${controller.text}\n${body(method(service, 'list'))}`;
    check(
      /Sort/.test(where) && /"createdAt"/.test(where) && /"id"/.test(where) && /desc|DESC|descending/.test(where),
      'Looked at how the inbox is sorted.',
    );
  });

  it('the inbox is paged in the database, not in memory', () => {
    const pagedFetch = orders.methods.some(
      (m) =>
        m.params.some((p) => /\bPageable\b/.test(p.type)) &&
        (!!annotation(m, 'EntityGraph') || /join\s+fetch/i.test(annotation(m, 'Query')?.text ?? '')),
    );
    check(!pagedFetch, 'Looked at the paged queries in PurchaseOrderRepository.');
  });
});
