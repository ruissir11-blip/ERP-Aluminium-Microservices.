# Tasks: Aluminum Business Module

**Input**: Design documents from `/specs/002-module-aluminium/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Install new dependencies and configure calculation utilities

- [x] T001 Install decimal.js for precise calculations: `npm install decimal.js`
- [x] T002 Install Puppeteer for PDF generation: `npm install puppeteer`
- [x] T003 Create aluminum module directory structure in `backend/src/`:
  - `models/aluminium/` (AluminumProfile, Quote, QuoteLine, etc.)
  - `services/aluminium/` (CalculationService, QuoteService, etc.)
  - `controllers/aluminium/` (ProfileController, QuoteController, etc.)
  - `routes/aluminium/` (profiles.routes.ts, quotes.routes.ts, etc.)
- [x] T004 Create aluminum types directory in `frontend/src/types/aluminium.types.ts`
- [x] T005 Create aluminum services directory in `frontend/src/services/aluminium/`
- [ ] T006 Create aluminum components directories:
  - `frontend/src/components/profiles/`
  - `frontend/src/components/quotes/`
  - `frontend/src/components/orders/`
- [x] T007 Update database configuration to include new entities

---

## Phase 2: Foundational (Data Model & Core Services)

**Purpose**: Core infrastructure and calculation engine

**⚠️ CRITICAL**: No business logic work can begin until this phase is complete

- [x] T010 [P] Create Customer entity in `backend/src/models/aluminium/Customer.ts`
- [x] T011 [P] Create AluminumProfile entity in `backend/src/models/aluminium/AluminumProfile.ts`
- [x] T012 Create database enum types and migration for aluminum entities
- [ ] T013 Run TypeORM migration to create tables
- [x] T014 Implement CalculationService with aluminum formulas in `backend/src/services/aluminium/CalculationService.ts`
- [x] T015 Implement decimal.js configuration for financial precision
- [ ] T016 Create calculation utilities for profile types (PLAT, TUBE, CORNIERE) in `backend/src/utils/calculations.ts`
- [x] T017 Implement ProfileService with CRUD operations in `backend/src/services/aluminium/ProfileService.ts`
- [ ] T018 Create CustomerService in `backend/src/services/CustomerService.ts`
- [ ] T019 Seed database with sample aluminum profiles (PLAT, TUBE, CORNIERE types)

**Checkpoint**: Foundation ready - calculation engine tested and working

---

## Phase 3: User Story 1 - Aluminum Profile Management (Priority: P1) 🎯 MVP

**Goal**: Implement aluminum profile catalog with CRUD operations

**Independent Test**: Can be tested by creating, viewing, editing, and deactivating profiles

- [x] T020 [US1] Create ProfileController with endpoints in `backend/src/controllers/aluminium/ProfileController.ts`
- [x] T021 [US1] Implement GET /api/profiles endpoint with filtering and pagination
- [x] T022 [US1] Implement POST /api/profiles endpoint for creating profiles
- [x] T023 [US1] Implement PUT /api/profiles/:id endpoint for updating profiles
- [x] T024 [US1] Implement DELETE /api/profiles/:id (soft delete) endpoint
- [x] T025 [US1] Implement POST /api/profiles/:id/calculate endpoint for weight/surface calculations
- [x] T026 [US1] Add profile routes in `backend/src/routes/aluminium/profiles.routes.ts`
- [x] T027 [US1] Create profile API service in `frontend/src/services/aluminium/profileApi.ts`
- [ ] T028 [US1] Build ProfileList component in `frontend/src/components/profiles/ProfileList.tsx`
- [ ] T029 [US1] Create ProfileForm component for create/edit in `frontend/src/components/profiles/ProfileForm.tsx`
- [ ] T030 [US1] Build ProfileDetail page in `frontend/src/pages/ProfileDetail.tsx`
- [ ] T031 [US1] Create ProfileCard component for catalog display
- [x] T032 [US1] Implement profile filtering by type (PLAT, TUBE, etc.)

**Checkpoint**: Profile management fully functional

---

## Phase 4: User Story 2 - Automatic Surface Calculation (Priority: P1)

**Goal**: Implement automatic surface area calculations for profiles

**Independent Test**: Can be tested by entering dimensions and verifying calculated surface

- [x] T033 [US2] Implement surface calculation formulas in CalculationService
- [x] T034 [US2] Add surface calculation for PLAT profiles: Surface = Length × Width
- [x] T035 [US2] Add surface calculation for TUBE profiles (round and square)
- [ ] T036 [US2] Create surface calculation unit tests with known values
- [ ] T037 [US2] Build SurfaceCalculator component in frontend for real-time calculation display
- [ ] T038 [US2] Add surface preview in ProfileForm when dimensions change
- [x] T039 [US2] Implement surface display in QuoteLine items

**Checkpoint**: Surface calculations working for all profile types

---

## Phase 5: User Story 3 - Automatic Weight Calculation (Priority: P1)

**Goal**: Implement automatic weight calculations using aluminum density (2.70 g/cm³)

**Independent Test**: Can be tested with known dimensions and verified against manual calculation

- [x] T040 [US3] Implement weight calculation formulas in CalculationService
- [x] T041 [US3] Add weight calculation for PLAT profiles using Volume × 2.70 g/cm³
- [x] T042 [US3] Add weight calculation for TUBE profiles with hollow section
- [x] T043 [US3] Support weight per meter override for complex profiles (UPN, IPE)
- [ ] T044 [US3] Create weight calculation unit tests with 0.1% tolerance validation
- [ ] T045 [US3] Build WeightCalculator component for real-time weight display
- [x] T046 [US3] Add weight preview in QuoteBuilder when quantity/length changes
- [x] T047 [US3] Display total weight in quote totals section

**Checkpoint**: Weight calculations accurate within 0.1% tolerance

---

## Phase 6: User Story 4 - Automatic Cost and Margin Calculation (Priority: P1)

**Goal**: Implement material cost and margin calculations

**Independent Test**: Can be tested with known costs and margin percentages

- [x] T048 [US4] Create Quote entity in `backend/src/models/aluminium/Quote.ts`
- [x] T049 [US4] Create QuoteLine entity in `backend/src/models/aluminium/QuoteLine.ts`
- [ ] T050 [US4] Run migration for Quote and QuoteLine tables
- [x] T051 [US4] Implement QuoteService with calculation logic in `backend/src/services/aluminium/QuoteService.ts`
- [x] T052 [US4] Add material cost calculation: Cost = Weight × Unit Price
- [x] T053 [US4] Add margin calculation: Margin = Selling Price - Material Cost
- [x] T054 [US4] Support margin display in both absolute value and percentage
- [x] T055 [US4] Implement line-level discount calculation
- [x] T056 [US4] Implement global discount calculation on quote subtotal
- [x] T057 [US4] Add VAT calculation at configurable rate (default 20%)
- [ ] T058 [US4] Build QuoteCalculator utility in frontend for price previews
- [ ] T059 [US4] Create margin visualization component showing cost vs selling price

**Checkpoint**: Cost and margin calculations working correctly

---

## Phase 7: User Story 5 - Quote Generation and Management (Priority: P1)

**Goal**: Implement professional quote generation with PDF output

**Independent Test**: Can be tested by creating a complete quote and generating PDF

- [x] T060 [US5] Create QuoteController in `backend/src/controllers/aluminium/QuoteController.ts`
- [x] T061 [US5] Implement POST /api/quotes endpoint for creating quotes
- [x] T062 [US5] Implement POST /api/quotes/:id/lines endpoint for adding lines
- [ ] T063 [US5] Implement PUT /api/quotes/:id/lines/:lineId for updating lines
- [x] T064 [US5] Implement DELETE /api/quotes/:id/lines/:lineId for removing lines
- [ ] T065 [US5] Implement GET /api/quotes/:id/pdf endpoint for PDF generation
- [ ] T066 [US5] Create PDF generation service using Puppeteer in `backend/src/services/PdfService.ts`
- [ ] T067 [US5] Design quote PDF template with company branding
- [x] T068 [US5] Implement quote number generation (format: D-{YYYY}-{SEQUENCE})
- [x] T069 [US5] Create quote API service in `frontend/src/services/aluminium/quoteApi.ts`
- [ ] T070 [US5] Build QuoteBuilder component in `frontend/src/components/quotes/QuoteBuilder.tsx`
- [ ] T071 [US5] Create QuoteLineItem component for line editing
- [ ] T072 [US5] Build QuoteList page in `frontend/src/pages/QuoteList.tsx`
- [ ] T073 [US5] Create QuoteDetail page with PDF preview
- [ ] T074 [US5] Implement quote duplication feature

**Checkpoint**: Quote generation with PDF working

---

## Phase 8: User Story 6 - Quote-to-Order Workflow (Priority: P1)

**Goal**: Implement quote workflow with state transitions

**Independent Test**: Can be tested by moving a quote through all workflow stages

- [x] T075 [US6] Create CustomerOrder entity in `backend/src/models/aluminium/CustomerOrder.ts`
- [ ] T076 [US6] Run migration for CustomerOrder table
- [x] T077 [US6] Implement Quote workflow state machine in `backend/src/services/aluminium/QuoteService.ts`
- [x] T078 [US6] Define valid state transitions (BROUILLON → ENVOYÉ → ACCEPTÉ → COMMANDE)
- [x] T079 [US6] Implement POST /api/quotes/:id/send endpoint (transition to ENVOYÉ)
- [x] T080 [US6] Implement POST /api/quotes/:id/accept endpoint (transition to ACCEPTÉ)
- [ ] T081 [US6] Implement POST /api/quotes/:id/refuse endpoint (transition to REFUSÉ)
- [x] T082 [US6] Implement POST /api/quotes/:id/convert endpoint (create CustomerOrder)
- [x] T083 [US6] Create workflow transition validation middleware
- [ ] T084 [US6] Add quote status badges and visual indicators in frontend
- [ ] T085 [US6] Build workflow action buttons (Send, Accept, Refuse, Convert)
- [ ] T086 [US6] Implement quote expiration check (daily cron job)

**Checkpoint**: Quote workflow fully functional with state transitions

---

## Phase 9: User Story 7 - Production Order Management (Priority: P2)

**Goal**: Implement production order tracking

**Independent Test**: Can be tested by creating and tracking production orders

- [ ] T087 [US7] Create ProductionOrder entity in `backend/src/models/ProductionOrder.ts`
- [ ] T088 [US7] Create ProductionOrderLine entity for order items
- [ ] T089 [US7] Run migration for production order tables
- [ ] T090 [US7] Implement ProductionService in `backend/src/services/ProductionService.ts`
- [ ] T091 [US7] Create ProductionController with endpoints
- [ ] T092 [US7] Implement production workflow: PLANIFIÉ → EN_COURS → TERMINÉ
- [ ] T093 [US7] Add time tracking (planned vs actual start/end)
- [ ] T094 [US7] Create production order API service in frontend
- [ ] T095 [US7] Build ProductionOrderList component
- [ ] T096 [US7] Create ProductionOrderForm for planning

**Checkpoint**: Production orders can be created and tracked

---

## Phase 10: User Story 8 - Delivery and Invoicing (Priority: P2)

**Goal**: Implement delivery notes and invoice generation

**Independent Test**: Can be tested by generating delivery notes and invoices

- [ ] T097 [US8] Create DeliveryNote entity in `backend/src/models/DeliveryNote.ts`
- [ ] T098 [US8] Create Invoice entity in `backend/src/models/Invoice.ts`
- [ ] T099 [US8] Run migration for delivery and invoice tables
- [ ] T100 [US8] Implement DeliveryService in `backend/src/services/DeliveryService.ts`
- [ ] T101 [US8] Implement InvoiceService in `backend/src/services/InvoiceService.ts`
- [ ] T102 [US8] Create invoice number generation (format: FAC-{YYYY}-{SEQUENCE})
- [ ] T103 [US8] Implement sequential invoice numbering validation
- [ ] T104 [US8] Create delivery note PDF template
- [ ] T105 [US8] Create invoice PDF template
- [ ] T106 [US8] Build DeliveryNoteList component in frontend
- [ ] T107 [US8] Build InvoiceList component in frontend
- [ ] T108 [US8] Implement invoice payment tracking

**Checkpoint**: Delivery and invoicing complete

---

## Phase 11: Integration & Testing

**Purpose**: Ensure all components work together

- [ ] T109 Create integration tests for quote-to-order workflow
- [ ] T110 Create integration tests for calculation accuracy
- [ ] T111 Create integration tests for PDF generation
- [ ] T112 Create integration tests for state transitions
- [ ] T113 Test end-to-end: Profile → Quote → Order → Production → Delivery → Invoice
- [ ] T114 Performance test: Quote generation with 10+ line items < 5 seconds
- [ ] T115 Performance test: PDF generation < 30 seconds

---

## Task Execution Rules

1. **Sequential Tasks**: Tasks without [P] marker must complete before dependent tasks
2. **Parallel Tasks**: Tasks with [P] marker can run simultaneously
3. **User Story Isolation**: Each US can be tested independently once its tasks complete
4. **Phase Gates**: Each phase has a checkpoint; don't proceed until checkpoint passed

## Dependencies

- **001-auth-security must be complete** before implementing this module
- User Stories 1-3 can be developed in parallel after Phase 2
- User Story 5 depends on User Stories 2-4
- User Story 6 depends on User Story 5
- User Stories 7-8 can be developed in parallel after User Story 6

---

**Tasks Version**: 1.0.0 | **Last Updated**: 2026-03-04
