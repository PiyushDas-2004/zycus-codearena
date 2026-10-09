> **Sample question.** This placeholder ships with CodeArena to demonstrate the format. Replace it before using the template with real candidates.

## Context

The mobile app places purchase orders through the **orders-service**, a Spring Boot 3 application backed by an in-memory H2 database in development. After the last merge, several problems appeared. Find the root causes and fix them.

You can't build or run the service here. Read the code, reason about how Spring behaves, and change the files directly.

## Bug reports

1. **Service won't start.** Since the last merge, the service fails to start locally and in CI.
2. **GET returns 500.** `GET /api/orders/{id}` returns HTTP 500 for an order that exists.
3. **Wrong status for unknown ids.** `GET /api/orders/{id}` for an unknown id returns 500. The API contract requires **404** with a problem-details body.
4. **No validation.** `POST /api/orders` accepts `{"customerEmail": "", "sku": "", "quantity": 0}`. The request DTO is annotated with constraints, but they are ignored.
5. **Partial writes.** When the inventory reservation fails (HTTP 409 is returned correctly), a `NEW` order is still left in the database. Orders whose reservation *succeeds* stay in status `NEW` instead of `RESERVED`.

## What to do

- Fix each problem. Files marked read-only are correct as written.
- Use standard Spring Boot mechanisms. Don't add third-party libraries beyond Spring Boot starters.
- In **Explain your fix**, give the root cause and your change for each report.

## Hints

- `ApiExceptionHandler` already maps some exceptions to HTTP statuses.
- Think about *how* Spring applies `@Transactional`.
