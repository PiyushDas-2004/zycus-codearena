import { annotation, body, calls, check, code, method, withHelpers } from './support/java';

const { controller, orders, service } = code;
const list = method(controller, 'list');
/** The inbox's code: the controller's list() and the service's list() with its helpers. */
const inbox = `${body(list)}\n${withHelpers(service, method(service, 'list'))}`;
/** The repository methods the inbox calls. */
const inboxQueries = orders.methods.filter((m) => calls(inbox, m.name));

describe('inbox paging', () => {
  it('page 1 is the first page', () => {
    check(/page\s*-\s*1/.test(body(list)) && /PageRequest\.of\s*\(/.test(body(list)), 'Looked at PurchaseOrderController.list().');
  });

  it('page 0 is refused', () => {
    // A check in the method (the JUnit test calls it directly; there is no bean validation here).
    check(
      /page\s*<\s*1|page\s*<=\s*0|1\s*>\s*page|0\s*>=\s*page/.test(body(list)) ||
        /Assert\.isTrue\s*\(\s*(page\s*>=\s*1|page\s*>\s*0|1\s*<=\s*page|0\s*<\s*page)\b/.test(body(list)),
      'Looked at PurchaseOrderController.list().',
    );
  });

  it('the order is stable: newest first, ties broken by id', () => {
    const where = `${controller.text}\n${inbox}`;
    const bySort = /Sort/.test(where) && /"createdAt"/.test(where) && /"id"/.test(where) && /desc|DESC|descending/.test(where);
    // Or in the query the inbox runs.
    const byQuery = inboxQueries.some(
      (m) =>
        /order\s+by\s+[\w.]*createdAt\s+desc\s*,\s*[\w.]*\bid\s+desc/i.test(annotation(m, 'Query')?.text ?? '') ||
        /OrderByCreatedAtDescIdDesc/.test(m.name),
    );
    check(bySort || byQuery, 'Looked at how the inbox is sorted.');
  });

  it('the inbox is paged in the database, not in memory', () => {
    const pagedFetch = inboxQueries.some(
      (m) =>
        m.params.some((p) => /\bPageable\b/.test(p.type)) &&
        (!!annotation(m, 'EntityGraph') || /join\s+fetch/i.test(annotation(m, 'Query')?.text ?? '')),
    );
    const inMemory = /\.subList\s*\(|\.skip\s*\(|PagedListHolder/.test(inbox);
    check(!pagedFetch && !inMemory, 'Looked at the queries the inbox runs and how it pages them.');
  });
});
