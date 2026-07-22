# Architecture Overview — Mini ERP + CRM Operations Portal

This document details the architectural decisions, database modeling, concurrency safeguards, and security controls built into the system.

---

## 1. Monorepo Architecture

```
/apps
  /api          NestJS 10 + TypeScript + Prisma ORM + PostgreSQL
  /web          React 18 + TypeScript + Vite + TailwindCSS + TanStack Query
/packages
  /shared-types Zod schemas & TypeScript DTO interfaces shared across API & Web
```

## 1. Monorepo Architecture & Runtime Validation

```
/apps
  /api          NestJS 10 + TypeScript + Prisma ORM + PostgreSQL
  /web          React 18 + TypeScript + Vite + TailwindCSS + TanStack Query
/packages
  /shared-types Zod schemas & nestjs-zod DTO classes shared across API & Web
```

### End-to-End Type Safety & Validation
- **Single Source of Truth**: Endpoints and DTO validations defined via Zod schemas in `@mini-erp/shared-types`.
- **Runtime Request Validation**: Shared Zod schemas are converted into NestJS DTO classes via `createZodDto()`. A global `ZodValidationPipe` in NestJS validates incoming request bodies and query parameters at runtime, returning standard 400 Bad Request error envelopes on validation failures.

---

## 2. Transactional Stock Control & Dual-Level Concurrency Safeguards

The single most critical requirement in wholesale inventory management is preventing negative stock and race conditions, even under simultaneous concurrent checkout requests.

### Implementation: Dual Row-Level Locking (`SELECT ... FOR UPDATE`)
When `POST /challans/:id/confirm` is invoked:
1. Open a Prisma `$transaction`.
2. **Challan Row Lock**: Execute `SELECT id, status FROM "Challan" WHERE id = $1 FOR UPDATE` to guarantee that concurrent status checks read locked status and reject double-confirm attempts immediately with a 409 Conflict exception.
3. **Product Row Lock**: Execute `SELECT id, "currentStock", name, sku FROM "Product" WHERE id = $1 FOR UPDATE` to lock target product rows.
4. Validate `currentStock >= requestedQuantity` *inside* the lock.
5. Decrement stock and insert an entry into the append-only `StockMovement` ledger.
6. **Atomic Challan Sequence Generation**: Execute `SELECT "yearMonth", "lastValue" FROM "ChallanSequence" WHERE "yearMonth" = $1 FOR UPDATE` to lock and increment the monthly counter row, producing gapless `CH-YYYYMM-00000X` numbers without database unique-constraint collisions.

### Test Verification
The Jest unit & concurrency test suite (`pnpm test:api`) includes dedicated concurrency tests using `Promise.allSettled`:
- Firing two simultaneous stock-OUT requests against stock=5 for qty=4 each.
- Firing two simultaneous `confirm()` calls against the same draft challan (asserting exactly 1 succeeds, 1 rejects with 409 Conflict, and stock is deducted once).
- Firing two simultaneous `confirm()` calls against two different draft challans (asserting both succeed with distinct sequence numbers).

---

## 3. Challan Lifecycle & Historical Snapshot Isolation

### Lifecycle States
`Draft` → `Confirmed` → `Cancelled`

### Historical Snapshot Isolation
When a challan line item is created or confirmed, product details are snapshotted onto `ChallanItem`:
- `productNameSnapshot`
- `skuSnapshot`
- `unitPriceSnapshot`
- `lineTotal`

**Guarding Rule**: Any subsequent edit or price change to a `Product` row will NEVER alter historical confirmed challans. Every invoice print and historical report reads exclusively from the `*Snapshot` columns.

### Cancellation Restocking
Cancelling a `Confirmed` challan generates offsetting `IN` stock movements (`reason: Restock offset on Challan Cancelled: CH-...`) and restores product stock levels. Original stock movement ledger records are never deleted or mutated.

---

## 4. Auth, Security & RBAC Matrix

### Token Strategy & Cross-Origin Cookies
- Access Token: Short-lived JWT (15 min) returned in JSON response body.
- Refresh Token: Long-lived JWT (7 days) stored in an `httpOnly`, `SameSite=None` (production with `Secure`) / `SameSite=Lax` (local) cookie.
- Mandatory Secrets: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are strictly required; missing secrets fail application bootstrap immediately.

### Client-Side Refresh Deduplication
The web client (`api.ts`) maintains a single in-flight `refreshTokenPromise`. Concurrent 401 API responses await the same background `/auth/refresh` HTTP call, preventing token-family revocation triggers.

### Token Reuse Detection & Hash Verification
If a revoked or previously used refresh token is presented at `/auth/refresh`, or if `bcrypt.compare(refreshToken, tokenRecord.tokenHash)` fails, the system revokes the user's entire active token family and returns a 401 Unauthorized.

### Login Rate Limiting
`POST /auth/login` is throttled via `@nestjs/throttler` (5 attempts per minute per IP address).

### Role Matrix

| Module | Admin | Sales | Warehouse | Accounts |
|---|---|---|---|---|
| Customers | Full | Full | — | Read-only |
| Products & Stock | Full | Read-only | Full | Read-only |
| Challans (Create/Edit Draft) | Full | Full | — | — |
| Challans (Confirm/Cancel) | Full | Full | — | — |
| Dashboard / Reports | Full | Full | Stock-scoped | Full |
| Users Management | Full | — | — | — |

