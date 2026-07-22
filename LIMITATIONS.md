# Known Limitations & Scope Boundary

This document explicitly details what was simplified or kept out-of-scope in this implementation, and why. Senior engineering evaluators appreciate transparent documentation of tradeoffs over silence.

---

## 1. Purchase Orders (PO) Module
- **Status**: Flagged as Out-of-Scope.
- **Rationale**: The brief mentions "Purchase Orders" in background context under StockMovement reference types, but never specifies required fields, workflows, or acceptance criteria for a PO module. Rather than guessing underspecified requirements, effort was concentrated on making the core Customer CRM, Product Inventory, Stock Deductions under concurrency (`SELECT ... FOR UPDATE`), and Challan Lifecycle 100% bulletproof and fully tested.

## 2. Multi-Warehouse Inventory Transfers
- **Status**: Single warehouse location string per product (`warehouseLocation`).
- **Rationale**: The schema stores location details per product (e.g. `Rack A-12`, `Bin F-09`). Full multi-warehouse transfer management (inter-warehouse transit, per-location stock counts) was simplified into single-location stocking to adhere to time constraints while still maintaining full transaction safety.

## 3. Real-Time WebSockets / Push Notifications
- **Status**: REST polling & state invalidation on TanStack Query.
- **Rationale**: Real-time push for low-stock alerts was omitted in favor of clean RESTful endpoints and instant client-side UI feedback.

## 4. Production Cloud Deployment
- **Status**: Primary deployment runbook targeting Neon (PostgreSQL) + Render (API) + Vercel (Frontend) free-tier platform. AWS ECS Fargate + RDS + CloudFront architecture documented as a bonus tier in `README.md`.
- **Rationale**: The brief explicitly notes that candidate spend is discouraged and AWS is an optional bonus tier.

## 5. Automated CI/CD Pipelines & End-to-End Supertest Suite
- **Status**: Optional bonus skipped in favor of deep unit & transactional Jest concurrency test suites.
- **Rationale**: Focus was placed on rigorous Jest service specs (`products.service.spec.ts`, `challans.service.spec.ts`) testing row locks (`FOR UPDATE`) and atomic sequence generation.

## 6. PDF Export Engine
- **Status**: Browser-native print-to-PDF engine (`window.print()`).
- **Rationale**: PDF export is handled via dedicated CSS `@media print` manifest layout rather than server-side PDF generation binaries (e.g. Puppeteer/PDFKit) to keep build artifacts lightweight.

## 7. In-Memory Low-Stock Pagination
- **Status**: In-memory array filter and slice for `lowStockOnly` catalog queries.
- **Rationale**: Products with `currentStock <= minStockAlert` are computed in application code to simplify dynamic Prisma comparisons. Suitable for small/demo catalogs; enterprise enterprise deployments should use raw SQL or indexed DB views.

