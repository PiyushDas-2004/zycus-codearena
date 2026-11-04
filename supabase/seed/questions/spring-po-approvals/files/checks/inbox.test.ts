import {
  annotation,
  body,
  calls,
  check,
  code,
  method,
  noStrings,
  smallConstants,
  withConstants,
  withHelpers,
} from './support/java';

const { controller, orders, service } = code;
const list = method(controller, 'list');
/** The controller's list(), as code, with constants such as FIRST_PAGE = 1 read as their value. */
const listCode = withConstants(noStrings(withHelpers(controller, list)), smallConstants(controller));
/** The inbox's code as written: the controller's list() and the service's list() with its helpers. */
const inboxText = `${body(list)}\n${withHelpers(service, method(service, 'list'))}`;
const inbox = noStrings(inboxText);
/** The repository methods the inbox calls. */
const inboxQueries = orders.methods.filter((m) => calls(inbox, m.name));
const fetchesLines = (m: (typeof orders.methods)[number]) =>
  !!annotation(m, 'EntityGraph') || /join\s+fetch/i.test(annotation(m, 'Query')?.text ?? '');

describe('inbox paging', () => {
  it('page 1 is the first page', () => {
    check(
      /page\s*-\s*1/.test(listCode) && /PageRequest\.of\s*\(/.test(listCode),
      'Looked at PurchaseOrderController.list().',
    );
  });

  it('page 0 is refused', () => {
    // A check in the method (the JUnit test calls it directly; there is no bean validation here).
    check(
      /page\s*<\s*1|page\s*<=\s*0|1\s*>\s*page|0\s*>=\s*page/.test(listCode) ||
        /Assert\.isTrue\s*\(\s*(page\s*>=\s*1|page\s*>\s*0|1\s*<=\s*page|0\s*<\s*page)\b/.test(listCode),
      'Looked at PurchaseOrderController.list().',
    );
  });

  it('the order is stable: newest first, ties broken by id', () => {
    // The Sort's property names are strings, so this reads the code as written.
    const where = `${controller.text}\n${inboxText}`;
    const newestFirst =
      /desc\s*\(\s*"createdAt"\s*\)/.test(where) ||
      /\bDESC\s*,\s*"createdAt"/.test(where) ||
      /Sort\.by\s*\(\s*"createdAt"[^;]*?\)\s*\.\s*descending\s*\(\)/.test(where) ||
      /Order\.by\s*\(\s*"createdAt"\s*\)\s*\.\s*with\s*\(\s*(Sort\.)?(Direction\.)?DESC/.test(where);
    const bySort = newestFirst && /"id"/.test(where);
    // Or in the query the inbox runs.
    const byQuery = inboxQueries.some(
      (m) =>
        /order\s+by\s+[\w.]*createdAt\s+desc\s*,\s*[\w.]*\bid\b/i.test(annotation(m, 'Query')?.text ?? '') ||
        /OrderByCreatedAtDesc(Id|IdDesc|IdAsc)\b/.test(m.name),
    );
    check(bySort || byQuery, 'Looked at how the inbox is sorted.');
  });

  it('the inbox is paged in the database, not in memory', () => {
    const pagedFetch = inboxQueries.some((m) => m.params.some((p) => /\bPageable\b/.test(p.type)) && fetchesLines(m));
    // A fetch join of every PO (not limited to one page's ids), paged afterwards.
    const fetchesEverything = inboxQueries.some(
      (m) => fetchesLines(m) && !m.params.some((p) => /\b(Pageable|Collection|List|Set|Iterable)\b|\[\]/.test(p.type)),
    );
    const inMemory = /\.subList\s*\(|\.skip\s*\(|PagedListHolder/.test(inbox) || fetchesEverything;
    check(!pagedFetch && !inMemory, 'Looked at the queries the inbox runs and how it pages them.');
  });
});
