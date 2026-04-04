# Tasks: Advanced Stock Management Module

**Input**: Design documents from `/specs/003-module-stock/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Install new dependencies and configure module infrastructure

- [ ] T001 Install decimal.js for precise calculations: `npm install decimal.js`
- [ ] T002 Install node-cron for scheduled jobs: `npm install node-cron`
- [ ] T003 Install nodemailer for alert notifications: `npm install nodemailer`
- [ ] T004 Install Redis client if not present: `npm install ioredis`
- [ ] T005 Create stock module directory structure in `backend/src/`:
  - `models/stock/` (Warehouse, StorageLocation, InventoryItem, StockMovement, StockAlert, Lot, LotTraceability, InventoryCount, InventoryCountLine, StockLayer)
  - `services/stock/` (WarehouseService, LocationService, InventoryService, StockMovementService, LotService, AlertService, ValuationService, RotationService, InventoryCountService)
  - `controllers/stock/` (WarehouseController, LocationController, InventoryController, MovementController, LotController, AlertController, InventoryCountController)
  - `routes/stock/` (warehouses.routes.ts, locations.routes.ts, inventory.routes.ts, movements.routes.ts, lots.routes.ts, alerts.routes.ts, inventory-counts.routes.ts)
  - `jobs/stock/` (rotation-analysis.job.ts, alert-processor.job.ts)
- [ ] T006 Create stock module frontend directories:
  - `frontend/src/components/stock/` (WarehouseSelector, LocationPicker, StockLevelTable, MovementHistory, LotTracker, AlertConfigurator, InventoryCountForm)
  - `frontend/src/pages/stock/` (StockManagement, WarehouseManagement, MovementHistory, LotTraceability, RotationAnalysis, InventoryCount)
  - `frontend/src/services/stock/` (warehouse.service.ts, inventory.service.ts, movement.service.ts, lot.service.ts, alert.service.ts)
  - `frontend/src/types/stock.types.ts`
- [ ] T007 Update database configuration to include stock entities
- [ ] T008 Configure Redis connection for stock caching in `backend/src/config/redis.ts`
- [ ] T009 Configure email transport for alert notifications

---

## Phase 2: Foundational (Data Model & Core Services)

**Purpose**: Core infrastructure and database schema

**⚠️ CRITICAL**: No business logic work can begin until this phase is complete

- [ ] T010 [P] Create database enum types in migration:
  - `lot_quality_status_enum` (APPROVED, QUARANTINE, REJECTED)
  - `movement_type_enum` (RECEIPT, ISSUE, TRANSFER, ADJUSTMENT, COUNT)
  - `inventory_count_status_enum` (DRAFT, IN_PROGRESS, VARIANCE_REVIEW, ADJUSTMENT_APPROVED, COMPLETED, CANCELLED)
  - `count_type_enum` (FULL, CYCLE, SPOT)
  - `traceability_event_enum` (RECEIPT, PRODUCTION, DELIVERY, RETURN, TRANSFER)
- [ ] T011 [P] Create Warehouse entity in `backend/src/models/stock/Warehouse.ts`
- [ ] T012 [P] Create StorageLocation entity in `backend/src/models/stock/StorageLocation.ts`
- [ ] T013 [P] Create Lot entity in `backend/src/models/stock/Lot.ts`
- [ ] T014 [P] Create InventoryItem entity in `backend/src/models/stock/InventoryItem.ts`
- [ ] T015 [P] Create StockMovement entity in `backend/src/models/stock/StockMovement.ts`
- [ ] T016 [P] Create StockAlert entity in `backend/src/models/stock/StockAlert.ts`
- [ ] T017 [P] Create LotTraceability entity in `backend/src/models/stock/LotTraceability.ts`
- [ ] T018 [P] Create InventoryCount entity in `backend/src/models/stock/InventoryCount.ts`
- [ ] T019 [P] Create InventoryCountLine entity in `backend/src/models/stock/InventoryCountLine.ts`
- [ ] T020 [P] Create StockLayer entity (FIFO) in `backend/src/models/stock/StockLayer.ts`
- [ ] T021 Create TypeORM migration `1710200000000-StockModule.ts` with all stock tables
- [ ] T022 Run migration to create stock tables: `npm run migration:run`
- [ ] T023 Create database indexes for performance:
  - InventoryItem: (profileId, warehouseId, locationId, lotId) UNIQUE
  - StockMovement: (profileId, performedAt), (warehouseId, performedAt)
  - StockLayer: (profileId, warehouseId, receiptDate) for FIFO
  - LotTraceability: (lotId, path) with GIN index

**Checkpoint**: Database schema complete and migration successful

---

## Phase 3: User Story 1 - Multi-Warehouse Management (Priority: P1) 🎯 MVP

**Goal**: Implement warehouse and storage location management

**Independent Test**: Can be tested by creating warehouses and locations, transferring stock between them

- [ ] T030 [US1] Implement WarehouseService with CRUD operations in `backend/src/services/stock/WarehouseService.ts`
- [ ] T031 [US1] Implement LocationService for storage location management in `backend/src/services/stock/LocationService.ts`
- [ ] T032 [US1] Create WarehouseController with endpoints in `backend/src/controllers/stock/WarehouseController.ts`
- [ ] T033 [US1] Create LocationController with endpoints in `backend/src/controllers/stock/LocationController.ts`
- [ ] T034 [US1] Implement GET /api/warehouses endpoint with includeInactive filter
- [ ] T035 [US1] Implement POST /api/warehouses endpoint for creating warehouses
- [ ] T036 [US1] Implement PUT /api/warehouses/:id endpoint for updating warehouses
- [ ] T037 [US1] Implement GET /api/warehouses/:id/locations endpoint
- [ ] T038 [US1] Implement POST /api/warehouses/:id/locations endpoint for creating storage locations
- [ ] T039 [US1] Add warehouse routes in `backend/src/routes/stock/warehouses.routes.ts`
- [ ] T040 [US1] Add location routes in `backend/src/routes/stock/locations.routes.ts`
- [ ] T041 [US1] Create warehouse API service in `frontend/src/services/stock/warehouse.service.ts`
- [ ] T042 [US1] Build WarehouseSelector component in `frontend/src/components/stock/WarehouseSelector.tsx`
- [ ] T043 [US1] Build LocationPicker component in `frontend/src/components/stock/LocationPicker.tsx`
- [ ] T044 [US1] Create WarehouseManagement page in `frontend/src/pages/stock/WarehouseManagement.tsx`
- [ ] T045 [US1] Implement warehouse deactivation with stock reassignment logic
- [ ] T046 [US1] Add unique code validation for warehouses and locations

**Checkpoint**: Multi-warehouse management fully functional

---

## Phase 4: User Story 2 - Automatic Stock Updates (Priority: P1)

**Goal**: Implement automatic stock updates from production and deliveries

**Independent Test**: Can be tested by simulating production completion and delivery validation

- [ ] T050 [US2] Implement InventoryService core methods in `backend/src/services/stock/InventoryService.ts`
- [ ] T051 [US2] Create StockMovementService in `backend/src/services/stock/StockMovementService.ts`
- [ ] T052 [US2] Implement receipt method for production completion (increase stock)
- [ ] T053 [US2] Implement issue method for delivery validation (decrease stock)
- [ ] T054 [US2] Implement transfer method for inter-warehouse transfers
- [ ] T055 [US2] Create InventoryController in `backend/src/controllers/stock/InventoryController.ts`
- [ ] T056 [US2] Create MovementController in `backend/src/controllers/stock/MovementController.ts`
- [ ] T057 [US2] Implement GET /api/inventory endpoint with filtering (profileId, warehouseId, locationId, lotId, lowStock)
- [ ] T058 [US2] Implement GET /api/inventory/summary endpoint for warehouse totals
- [ ] T059 [US2] Implement POST /api/inventory/transfer endpoint for stock transfers
- [ ] T060 [US2] Add inventory routes in `backend/src/routes/stock/inventory.routes.ts`
- [ ] T061 [US2] Add movement routes in `backend/src/routes/stock/movements.routes.ts`
- [ ] T062 [US2] Implement optimistic locking with version field to prevent race conditions
- [ ] T063 [US2] Add negative stock prevention (configurable per warehouse)
- [ ] T064 [US2] Create inventory API service in `frontend/src/services/stock/inventory.service.ts`
- [ ] T065 [US2] Build StockLevelTable component in `frontend/src/components/stock/StockLevelTable.tsx`
- [ ] T066 [US2] Create StockManagement page in `frontend/src/pages/stock/StockManagement.tsx`
- [ ] T067 [US2] Implement automatic stock update hooks for production module integration
- [ ] T068 [US2] Add stock transfer UI with source/destination warehouse selection

**Checkpoint**: Automatic stock updates working within 2 seconds

---

## Phase 5: User Story 3 - Stock Alert Threshold (Priority: P1)

**Goal**: Implement configurable alert thresholds with notifications

**Independent Test**: Can be tested by setting thresholds and simulating stock decrease

- [ ] T070 [US3] Implement AlertService in `backend/src/services/stock/AlertService.ts`
- [ ] T071 [US3] Create alert threshold configuration methods (minimum, maximum, reorder point)
- [ ] T072 [US3] Implement threshold checking on every stock movement
- [ ] T073 [US3] Create AlertController in `backend/src/controllers/stock/AlertController.ts`
- [ ] T074 [US3] Implement GET /api/alerts endpoint with filtering (profileId, warehouseId, isTriggered, isActive)
- [ ] T075 [US3] Implement POST /api/alerts endpoint for creating alert thresholds
- [ ] T076 [US3] Implement POST /api/alerts/:id/acknowledge endpoint
- [ ] T077 [US3] Add alert routes in `backend/src/routes/stock/alerts.routes.ts`
- [ ] T078 [US3] Implement Redis pub/sub for real-time alert events
- [ ] T079 [US3] Create scheduled alert check job (fallback polling every 5 minutes)
- [ ] T080 [US3] Implement email notification using nodemailer
- [ ] T081 [US3] Create alert notification templates
- [ ] T082 [US3] Add dashboard alert indicators (green/adequate, orange/low, red/critical)
- [ ] T083 [US3] Create alert API service in `frontend/src/services/stock/alert.service.ts`
- [ ] T084 [US3] Build AlertConfigurator component in `frontend/src/components/stock/AlertConfigurator.tsx`
- [ ] T085 [US3] Implement alert acknowledgment UI with notes
- [ ] T086 [US3] Add alert history tracking

**Checkpoint**: Alerts triggered within 5 minutes of threshold breach

---

## Phase 6: User Story 4 - Stock Movement History (Priority: P1)

**Goal**: Implement complete stock movement tracking and history

**Independent Test**: Can be tested by performing movements and querying history

- [ ] T090 [US4] Enhance StockMovementService with history query methods
- [ ] T091 [US4] Implement GET /api/movements endpoint with filtering (profileId, warehouseId, movementType, date range, pagination)
- [ ] T092 [US4] Add denormalized fields to StockMovement (previousQuantity, newQuantity, ipAddress)
- [ ] T093 [US4] Implement audit trail immutability (no updates/deletes allowed)
- [ ] T094 [US4] Create MovementHistory component in `frontend/src/components/stock/MovementHistory.tsx`
- [ ] T095 [US4] Build MovementHistory page in `frontend/src/pages/stock/MovementHistory.tsx`
- [ ] T096 [US4] Implement date range filtering for movement history
- [ ] T097 [US4] Add movement type filtering (RECEIPT, ISSUE, TRANSFER, ADJUSTMENT, COUNT)
- [ ] T098 [US4] Create movement detail view with full audit information
- [ ] T099 [US4] Implement movement export functionality (CSV)
- [ ] T100 [US4] Add pagination for large history queries (target <3 seconds for 10K records)

**Checkpoint**: Movement history queryable within 3 seconds for 10K records

---

## Phase 7: User Story 5 - Lot and Traceability Management (Priority: P1)

**Goal**: Implement lot tracking with complete traceability chain

**Independent Test**: Can be tested by receiving items with lots and tracing them

- [ ] T110 [US5] Implement LotService in `backend/src/services/stock/LotService.ts`
- [ ] T111 [US5] Create lot creation on receipt with supplier info and COC reference
- [ ] T112 [US5] Implement LotController in `backend/src/controllers/stock/LotController.ts`
- [ ] T113 [US5] Implement GET /api/lots endpoint with filtering (profileId, supplierId, qualityStatus)
- [ ] T114 [US5] Implement POST /api/lots endpoint for creating lots
- [ ] T115 [US5] Implement GET /api/lots/:id endpoint for lot details
- [ ] T116 [US5] Implement GET /api/lots/:id/traceability endpoint for traceability chain
- [ ] T117 [US5] Add lot routes in `backend/src/routes/stock/lots.routes.ts`
- [ ] T118 [US5] Implement recursive CTE query for traceability chain traversal
- [ ] T119 [US5] Create materialized path for fast traceability queries
- [ ] T120 [US5] Implement lot quality status workflow (QUARANTINE → APPROVED/REJECTED)
- [ ] T121 [US5] Add lot validation (reject transactions with invalid lot numbers)
- [ ] T122 [US5] Create lot API service in `frontend/src/services/stock/lot.service.ts`
- [ ] T123 [US5] Build LotTracker component in `frontend/src/components/stock/LotTracker.tsx`
- [ ] T124 [US5] Create LotTraceability page in `frontend/src/pages/stock/LotTraceability.tsx`
- [ ] T125 [US5] Implement visual traceability chain display (receipt → production → customer)
- [ ] T126 [US5] Add affected order identification for recall scenarios

**Checkpoint**: Lot traceability report within 30 seconds for any given lot

---

## Phase 8: User Story 6 - Stock Rotation Analysis (Priority: P2)

**Goal**: Implement rotation rate analysis and slow-moving item identification

**Independent Test**: Can be tested by running analysis on historical data

- [ ] T130 [US6] Implement RotationService in `backend/src/services/stock/RotationService.ts`
- [ ] T131 [US6] Create rotation rate calculation: Rotation = Total Issues ÷ Average Stock
- [ ] T132 [US6] Create coverage days calculation: Coverage = Available Stock ÷ Average Daily Consumption
- [ ] T133 [US6] Implement GET /api/analytics/rotation endpoint
- [ ] T134 [US6] Add filtering by date range and warehouse
- [ ] T135 [US6] Create rotation analysis scheduled job (runs daily/weekly)
- [ ] T136 [US6] Implement color coding for rotation rates (fast/medium/slow)
- [ ] T137 [US6] Flag items with rotation rate <0.5 over 6 months as "slow-moving"
- [ ] T138 [US6] Create rotation analysis API service in frontend
- [ ] T139 [US6] Build RotationAnalysis page in `frontend/src/pages/stock/RotationAnalysis.tsx`
- [ ] T140 [US6] Add sortable rotation rate table with recommendations
- [ ] T141 [US6] Implement rotation trend charts (optional enhancement)

**Checkpoint**: Rotation analysis identifying slow-moving items accurately

---

## Phase 9: User Story 7 - Stock Valuation (Priority: P2)

**Goal**: Implement FIFO valuation for inventory value calculation

**Independent Test**: Can be tested by verifying FIFO cost calculation against manual calculation

- [ ] T150 [US7] Implement ValuationService in `backend/src/services/stock/ValuationService.ts`
- [ ] T151 [US7] Create perpetual FIFO with StockLayer tracking
- [ ] T152 [US7] Implement FIFO consumption on stock issues (oldest layers first)
- [ ] T153 [US7] Add StockLayer creation on receipts with unit cost
- [ ] T154 [US7] Implement GET /api/inventory/valuation endpoint
- [ ] T155 [US7] Add valuation breakdown by warehouse
- [ ] T156 [US7] Calculate total inventory value using Decimal.js for precision
- [ ] T157 [US7] Implement COGS (Cost of Goods Sold) calculation at time of issue
- [ ] T158 [US7] Add support for weighted average as alternative valuation method
- [ ] T159 [US7] Create valuation report with FIFO layer details
- [ ] T160 [US7] Ensure FIFO accuracy within 0.1% vs accounting records
- [ ] T161 [US7] Add valuation API endpoints to inventory controller

**Checkpoint**: Stock valuation accurate within 0.1%, FIFO layers properly consumed

---

## Phase 10: User Story 8 - Inventory Count (Priority: P2)

**Goal**: Implement physical inventory counting workflow

**Independent Test**: Can be tested by performing complete count workflow

- [ ] T170 [US8] Implement InventoryCountService in `backend/src/services/stock/InventoryCountService.ts`
- [ ] T171 [US8] Create inventory count workflow state machine (DRAFT → IN_PROGRESS → VARIANCE_REVIEW → ADJUSTMENT_APPROVED → COMPLETED)
- [ ] T172 [US8] Implement count initiation with system quantity snapshot
- [ ] T173 [US8] Create variance calculation (counted - system) with percentage
- [ ] T174 [US8] Implement two-phase approval workflow for adjustments
- [ ] T175 [US8] Create InventoryCountController in `backend/src/controllers/stock/InventoryCountController.ts`
- [ ] T176 [US8] Implement GET /api/inventory-counts endpoint with status filtering
- [ ] T177 [US8] Implement POST /api/inventory-counts endpoint for creating counts
- [ ] T178 [US8] Implement POST /api/inventory-counts/:id/start endpoint (transition to IN_PROGRESS)
- [ ] T179 [US8] Implement POST /api/inventory-counts/:id/submit endpoint (transition to VARIANCE_REVIEW)
- [ ] T180 [US8] Implement POST /api/inventory-counts/:id/approve endpoint (transition to ADJUSTMENT_APPROVED)
- [ ] T181 [US8] Implement POST /api/inventory-counts/:id/apply endpoint (transition to COMPLETED)
- [ ] T182 [US8] Implement POST /api/inventory-counts/:id/cancel endpoint
- [ ] T183 [US8] Add inventory count routes in `backend/src/routes/stock/inventory-counts.routes.ts`
- [ ] T184 [US8] Implement count line recording with counted quantity
- [ ] T185 [US8] Add recount request functionality for specific lines
- [ ] T186 [US8] Create reason codes for variances (COUNT_ERROR, THEFT, DAMAGE, SYSTEM_ERROR, OTHER)
- [ ] T187 [US8] Post approved adjustments as StockMovement records with type COUNT
- [ ] T188 [US8] Build InventoryCountForm component in `frontend/src/components/stock/InventoryCountForm.tsx`
- [ ] T189 [US8] Create InventoryCount page in `frontend/src/pages/stock/InventoryCount.tsx`
- [ ] T190 [US8] Implement variance report view for supervisors
- [ ] T191 [US8] Add count progress tracking UI

**Checkpoint**: Inventory count workflow complete, adjustments properly audited

---

## Phase 11: Polish & Integration

**Purpose**: Final integration, testing, and performance optimization

- [ ] T200 Implement Redis caching for stock levels with cache-aside + write-through pattern
- [ ] T201 Add cache invalidation rules for all stock operations
- [ ] T202 Implement stock search and filtering (profile, warehouse, location, lot, date range)
- [ ] T203 Add stock level dashboard KPI cards (total items, total value, low stock count)
- [ ] T204 Create comprehensive unit tests for all services
- [ ] T205 Create integration tests for API endpoints
- [ ] T206 Implement RBAC enforcement (Stock Manager, Stock Clerk, Quality Manager, Admin roles)
- [ ] T207 Add rate limiting for stock movement endpoints
- [ ] T208 Implement stock report exports (PDF, Excel)
- [ ] T209 Add stock analytics dashboard with charts
- [ ] T210 Performance optimization: Add database query optimizations
- [ ] T211 Performance optimization: Implement connection pooling review
- [ ] T212 Add comprehensive error handling and logging
- [ ] T213 Create stock module documentation
- [ ] T214 Run full test suite: `npm test`
- [ ] T215 Run linter: `npm run lint`

**Final Checkpoint**: Module ready for production deployment

---

## Task Summary

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Setup | 9 |
| Phase 2 | Foundational | 14 |
| Phase 3 | US1: Multi-Warehouse Management | 17 |
| Phase 4 | US2: Automatic Stock Updates | 19 |
| Phase 5 | US3: Stock Alert Threshold | 17 |
| Phase 6 | US4: Stock Movement History | 11 |
| Phase 7 | US5: Lot and Traceability | 17 |
| Phase 8 | US6: Stock Rotation Analysis | 12 |
| Phase 9 | US7: Stock Valuation | 12 |
| Phase 10 | US8: Inventory Count | 22 |
| Phase 11 | Polish & Integration | 16 |
| **Total** | | **166** |

---

## User Story Task Distribution

| User Story | Priority | Task Count |
|------------|----------|------------|
| US1: Multi-Warehouse Management | P1 | 17 |
| US2: Automatic Stock Updates | P1 | 19 |
| US3: Stock Alert Threshold | P1 | 17 |
| US4: Stock Movement History | P1 | 11 |
| US5: Lot and Traceability | P1 | 17 |
| US6: Stock Rotation Analysis | P2 | 12 |
| US7: Stock Valuation | P2 | 12 |
| US8: Inventory Count | P2 | 22 |

---

**Tasks Version**: 1.0.0 | **Last Updated**: 2026-03-04
