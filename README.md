# Mini ERP + CRM Operations Portal
### Enterprise Wholesale & Distribution Operations Suite

A production-grade monorepo containing a NestJS backend and React frontend for managing wholesale customers (CRM), product catalog & inventory ledger, transactional stock control under concurrency, delivery challans, and real-time operations analytics.

---

## 🔑 Test Logins (Seeded Demo Accounts)

All accounts share the documented test password: **`Password@123`**

| Role | Email | Permissions / Access |
|---|---|---|
| **Admin** | `admin@minierp.com` | Full access across all modules, user administration, soft-deletes |
| **Sales** | `sales@minierp.com` | Full CRM customer access, create/edit/confirm delivery challans |
| **Warehouse** | `warehouse@minierp.com` | Product CRUD, manual stock movements (IN/OUT), read-only challans for picking |
| **Accounts** | `accounts@minierp.com` | Read-only access across CRM & inventory, full access to invoices & dashboard |

---

## 🛠️ Stack & Monorepo Structure

- **Backend**: NestJS 10 + TypeScript + Prisma ORM + PostgreSQL 16 + JWT & Refresh Tokens
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + TanStack Query + Lucide Icons
- **Shared Package**: `@mini-erp/shared-types` (Zod DTO schemas shared across FE and BE)
- **Database**: PostgreSQL with row-level locking (`SELECT ... FOR UPDATE`)

```
/apps
  /api          NestJS backend application (Port 3000)
  /web          React Vite frontend application (Port 5173)
/packages
  /shared-types Shared Zod DTO schemas and TypeScript interfaces
/postman        Postman export collection & environment
```

---

## ⚙️ Environment Variables

### `/apps/api/.env`

| Variable | Purpose | Example Value |
|---|---|---|
| `PORT` | NestJS server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://sridhar@localhost:5432/mini_erp_db?schema=public` |
| `JWT_ACCESS_SECRET` | Secret key for 15-min access tokens | `super-secret-access-key-for-mini-erp-crm-2026` |
| `JWT_REFRESH_SECRET` | Secret key for 7-day refresh tokens | `super-secret-refresh-key-for-mini-erp-crm-2026` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

---

## 🚀 Quickstart Runbook (Local Setup under 5 Minutes)

### Prerequisites
- Node.js >= v20
- pnpm >= v9
- Local PostgreSQL running on port 5432 (or Docker Desktop)

### 1. Install Monorepo Dependencies
```bash
pnpm install
```

### 2. Build Shared Package & Generate Prisma Client
```bash
pnpm build:types
pnpm --filter api prisma:generate
```

### 3. Setup PostgreSQL Database & Run Migrations + Seeding
```bash
createdb mini_erp_db || true
pnpm --filter api prisma:migrate --name init
pnpm --filter api prisma:seed
```

### 4. Run Development Servers
```bash
# Run both API and Web concurrently
pnpm dev:api
# In another terminal:
pnpm dev:web
```
- Frontend Web App: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger OpenAPI Specs: `http://localhost:3000/api/docs`

---

## 🧪 Running Automated Unit & Concurrency Tests

```bash
# Run Jest concurrency and business logic unit tests
pnpm --filter api test
```
**Key Verification Tests Included:**
1. **Stock Concurrency Lock Test**: Fires two simultaneous stock-OUT requests against stock=5 for qty=4. Exactly one succeeds, one fails with 400 Bad Request, and stock never goes negative.
2. **Double-Submit Idempotency Test**: Confirms a challan twice; verifies second attempt fails with 409 Conflict without double-deducting stock.
3. **Price Snapshot Isolation Test**: Modifies product unit price after challan confirmation; verifies historical challan total remains untouched.
4. **Restocking on Cancellation Test**: Cancels a confirmed challan; verifies stock is restored via offsetting `IN` stock movements.

---

## 📮 Postman Collection & Swagger Docs

- **Live Swagger OpenAPI Docs**: `http://localhost:3000/api/docs`
- **Postman Collection**: Located in `/postman/Mini_ERP_CRM.postman_collection.json`.

---

## 🌐 Deployment Runbook

### Free Tier Path (Neon + Render + Vercel)
1. **Neon PostgreSQL**: Create database -> set `DATABASE_URL`.
2. **Render (API Service)**: Connect `/apps/api` repo. Set build command: `pnpm install && pnpm build:types && pnpm --filter api build` and start command `pnpm --filter api start:prod`. Run `pnpm db:migrate` and `pnpm db:seed` via Render shell.
3. **Vercel (Web Frontend)**: Connect `/apps/web` repo. Set `VITE_API_URL` to Render API URL.

### AWS Bonus Architecture (Documented Path)
- **ECS Fargate**: Containerized NestJS API behind an Application Load Balancer (ALB).
- **RDS PostgreSQL**: Single-AZ PostgreSQL instance with multi-AZ failover options.
- **CloudFront + S3**: Static site hosting for React bundle and asset storage.
- **Secrets Manager**: Managed rotation for JWT secret keys.
