## Reference solution (reviewers only)

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Service won't start | `spring.jpa.hibernate.ddl-auto=validate` checks the schema against the entities, but the in-memory H2 database is empty, so it fails with *Schema-validation: missing table [purchase_orders]* | For the dev/CI in-memory DB, use `create-drop`. Alternatively, add a schema (`schema.sql`, or Flyway with `validate`). Strong answers note that production should use migrations plus `validate`, never `update` |
| 2 | GET returns 500 for an existing order | The URI template variable is `{orderId}`, but the parameter is bound by name as `id`, so Spring throws `MissingPathVariableException` (500) | `@PathVariable("orderId") Long id`, or rename one side so they match |
| 3 | Unknown id returns 500 | `findById(id).get()` throws `NoSuchElementException`, which has no handler, so it becomes a 500 | `findById(id).orElseThrow(() -> new OrderNotFoundException(id))`. The existing handler returns a 404 problem-details body |
| 4 | Invalid input accepted | Only the **API** (`jakarta.validation-api`) is on the classpath, with no **provider** (Hibernate Validator). Spring Boot only enables method/argument validation when a provider is present, so `@Valid` is silently ignored | Replace the API dependency with `spring-boot-starter-validation`. Invalid requests then get 400 |
| 5 | Partial writes; orders stay `NEW` | `@Transactional` is applied by a Spring **proxy**. A `private` method is never proxied, and `placeOrder` calls it via `this`, so the call bypasses the proxy either way. `save()` commits in its own repository transaction, a reservation failure can't roll it back, and `markReserved()` runs on a detached entity, so it is never flushed | Put `@Transactional` on the public `placeOrder` and inline the logic, or move it to a separate bean. The save, reservation and status change then commit or roll back together |

**Good signs in a candidate's answer:**
- Clearly explains proxy-based AOP and self-invocation, not just "make it public".
- Mentions that a remote call (the inventory reservation) inside a DB transaction holds the transaction open. They may suggest an outbox/saga or a compensating cancel as a production improvement (bonus, not required).
- Suggests tests: `@WebMvcTest` for 400/404, and `@SpringBootTest` with a mocked `InventoryClient` throwing, asserting no orders remain.

**Red flags:**
- `ddl-auto=update` presented as the production fix.
- Catching `NoSuchElementException` in the controller and returning `null`.
- Adding `@Validated` everywhere without adding a validation provider.
