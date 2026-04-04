# Implementation Plan: Module B — Stock Avancé (Advanced Stock Management)

**Branch**: `003-module-stock` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-module-stock/spec.md`

## Summary

This plan implements the Advanced Stock Management module for the ERP Aluminium platform. The module provides multi-warehouse inventory tracking with automatic stock updates from production and deliveries, configurable alert thresholds, complete lot/traceability management, stock rotation analysis, and physical inventory count workflows. This module is **critical for operational continuity** as it prevents production stoppages due to material shortages and ensures complete traceability for quality compliance.

**Technical approach**: Node.js/Express backend with TypeScript, TypeORM for data persistence, Redis for real-time stock caching and alert queuing, PostgreSQL for transactional integrity and audit trails. FIFO valuation engine with decimal precision for financial accuracy.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.3  
**Primary Dependencies**: Express.js 4.x, TypeORM 0.3.x, Redis 7.x (caching + pub/sub for alerts), node-cron 3.x (scheduled rotation analysis), decimal.js 10.x (precision calculations), nodemailer 6.x (alert notifications)  
**Storage**: PostgreSQL 15+ (primary with ACID transactions), Redis 7+ (stock level caching, alert queue)  
**Testing**: Jest 29.x, Supertest 6.x  
**Target Platform**: Docker containers on Linux (development & production)  
**Project Type**: Web service (REST API + Frontend SPA)  
**Performance Goals**: Stock updates within 2 seconds, alert notifications within 5 minutes, history queries <3 seconds for 10K records, traceability reports <30 seconds  
**Constraints**: FIFO valuation accuracy within 0.1%, no negative stock allowed (configurable per warehouse), lot traceability chain must be unbroken, audit trail immutable  
**Scale/Scope**: 5+ warehouses, 10,000+ inventory items, 1,000+ daily stock movements, 100+ lots tracked simultaneously

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain-Driven Design | ✅ PASS | Stock entities (Warehouse, Location, Lot, Movement) are first-class domain concepts with aluminum-specific attributes |
| II. Security-First Architecture | ✅ PASS | RBAC enforcement (Stock, Admin roles), all movements audited with user/timestamp/IP |
| III. Data Integrity & Traceability | ✅ PASS | Complete audit trail for all stock changes, lot traceability from supplier to customer, FIFO valuation history preserved |
| IV. Modular Monolith Architecture | ✅ PASS | Module exposes internal API only, depends on Auth and Aluminium modules, provides API to BI/AI modules |
| V. Observability & Auditability | ✅ PASS | Stock level dashboards, rotation analysis reports, alert history, movement audit trails |
| VI. Performance Standards | ✅ PASS | Targets defined: <2s updates, <5min alerts, <3s queries, <30s traceability reports |
| VII. Specification-Driven Development | ✅ PASS | Spec complete with user stories, acceptance criteria, entity definitions, edge cases |
| VIII. AI-Ready Architecture | ✅ PASS | Stock history, rotation data, consumption patterns available for demand forecasting ML models |

**Gate Result**: ✅ ALL CHECKS PASSED - Proceeding to research phase

## Project Structure

### Documentation (this feature)

```text
specs/003-module-stock/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── stock-api.yaml        # OpenAPI specification
│   └── workflows.md          # State machine definitions
└── checklists/
    └── requirements.md  # Validation checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/          # Environment, database config
│   ├── models/          # TypeORM entities
│   │   ├── aluminium/   # (from module-aluminium)
│   │   │   ├── AluminumProfile.ts
│   │   │   ├── Quote.ts
│   │   │   ├── QuoteLine.ts
│   │   │   └── CustomerOrder.ts
│   │   └── stock/       # NEW: Stock module entities
│   │       ├── Warehouse.ts
│   │       ├── StorageLocation.ts
│   │       ├── InventoryItem.ts
│   │       ├── StockMovement.ts
│   │       ├── StockAlert.ts
│   │       ├── Lot.ts
│   │       ├── InventoryCount.ts
│   │       └── InventoryCountLine.ts
│   ├── services/        # Business logic
│   │   ├── aluminium/   # (from module-aluminium)
│   │   │   ├── ProfileService.ts
│   │   │   ├── CalculationService.ts
│   │   │   └── QuoteService.ts
│   │   └── stock/       # NEW: Stock module services
│   │       ├── WarehouseService.ts
│   │       ├── LocationService.ts
│   │       ├── InventoryService.ts      # Core stock management
│   │       ├── StockMovementService.ts  # Movement tracking
│   │       ├── LotService.ts            # Lot/traceability
│   │       ├── AlertService.ts          # Threshold alerts
│   │       ├── ValuationService.ts      # FIFO calculations
│   │       ├── RotationService.ts       # Rotation analysis
│   │       └── InventoryCountService.ts # Physical counts
│   ├── controllers/     # HTTP request handlers
│   │   └── stock/       # NEW: Stock controllers
│   │       ├── WarehouseController.ts
│   │       ├── LocationController.ts
│   │       ├── InventoryController.ts
│   │       ├── MovementController.ts
│   │       ├── LotController.ts
│   │       ├── AlertController.ts
│   │       └── InventoryCountController.ts
│   ├── routes/          # Route definitions
│   │   └── stock/       # NEW: Stock routes
│   │       ├── warehouses.routes.ts
│   │       ├── locations.routes.ts
│   │       ├── inventory.routes.ts
│   │       ├── movements.routes.ts
│   │       ├── lots.routes.ts
│   │       ├── alerts.routes.ts
│   │       └── inventory-counts.routes.ts
│   ├── jobs/            # Scheduled tasks
│   │   └── stock/       # NEW: Stock scheduled jobs
│   │       ├── rotation-analysis.job.ts
│   │       └── alert-processor.job.ts
│   └── app.ts           # Express app setup (add stock routes)
├── tests/
│   ├── unit/            # Service logic tests
│   │   └── stock/       # NEW: Stock unit tests
│   ├── integration/     # API integration tests
│   │   └── stock/       # NEW: Stock integration tests
│   └── contract/        # Contract tests
│       └── stock/       # NEW: Stock contract tests

frontend/
├── src/
│   ├── components/
│   │   └── stock/       # NEW: Stock components
│   │       ├── WarehouseSelector.tsx
│   │       ├── LocationPicker.tsx
│   │       ├── StockLevelTable.tsx
│   │       ├── MovementHistory.tsx
│   │       ├── LotTracker.tsx
│   │       ├── AlertConfigurator.tsx
│   │       └── InventoryCountForm.tsx
│   ├── pages/
│   │   └── stock/       # NEW: Stock pages
│   │       ├── StockManagement.tsx
│   │       ├── WarehouseManagement.tsx
│   │       ├── MovementHistory.tsx
│   │       ├── LotTraceability.tsx
│   │       ├── RotationAnalysis.tsx
│   │       └── InventoryCount.tsx
│   ├── services/
│   │   └── stock/       # NEW: Stock API clients
│   │       ├── warehouse.service.ts
│   │       ├── inventory.service.ts
│   │       ├── movement.service.ts
│   │       ├── lot.service.ts
│   │       └── alert.service.ts
│   └── types/
│       └── stock.types.ts  # NEW: Stock TypeScript types
```

**Structure Decision**: Web application with separate backend (Node.js/Express) and frontend (React), following the established pattern from module-aluminium. Stock module extends the existing aluminium module structure with parallel organization under `stock/` subdirectories.

## Complexity Tracking

> No constitution violations requiring justification.

## Implementation Phases

### Phase 0: Research & Unknowns

**Goal**: Resolve all technical unknowns before design

**Research Areas**:
1. FIFO valuation algorithm implementation strategies for inventory systems
2. Lot traceability query patterns for unbroken chain tracking
3. Stock movement audit trail storage patterns (event sourcing vs snapshot)
4. Redis caching strategies for real-time stock levels with consistency guarantees
5. Alert threshold processing patterns (polling vs event-driven)
6. Inventory count variance handling workflows

**Output**: `research.md` with decisions and rationale

### Phase 1: Design & Contracts

**Goal**: Define data models, API contracts, and implementation guide

**Tasks**:
1. Extract entities from spec → `data-model.md`
2. Define API contracts → `contracts/stock-api.yaml`
3. Document workflow states → `contracts/workflows.md`
4. Create implementation guide → `quickstart.md`
5. Update agent context with stock module technologies

**Output**: data-model.md, contracts/, quickstart.md

### Phase 2: Task Breakdown

**Goal**: Create implementation tasks

*Note: This phase is executed by `/speckit.tasks` command, not this plan.*

## Dependencies

### Required By This Module
- `001-auth-security`: Authentication, RBAC (Stock, Admin roles)
- `002-module-aluminium`: Profile definitions, Quote/Order integration points for automatic stock updates

### Modules Depending On This
- `004-module-maintenance`: Spare parts inventory integration
- `005-module-qualite`: Non-conformity lot quarantine management
- `006-comptabilite-analytique`: Stock valuation for financial reporting
- `007-bi-dashboard`: Stock KPIs and analytics
- `008-ai-module`: Demand forecasting, stock optimization recommendations

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| FIFO valuation calculation errors | Medium | High | Use Decimal.js, extensive unit testing, reconcile with accounting periodically |
| Race conditions on concurrent stock updates | Medium | High | Optimistic locking with versioning, database transactions, Redis atomic operations |
| Lot traceability chain breaks | Low | High | Enforce lot assignment on all receipts, validate chain integrity reports, reject transactions without lot |
| Alert notification delays | Medium | Medium | Redis pub/sub for real-time, fallback polling, alert queue monitoring |
| Performance degradation with large movement history | Medium | Medium | Partitioning by date, archiving old data, query optimization with indexes |
| Negative stock in strict mode | Low | High | Database constraints, application validation, admin override with audit trail |

## Timeline Estimate

- Phase 0 (Research): 2 days
- Phase 1 (Design): 3 days
- Phase 2 (Task breakdown): 1 day
- Implementation (estimated): 5-7 weeks

---

**Plan Version**: 1.0.0 | **Last Updated**: 2026-03-04
