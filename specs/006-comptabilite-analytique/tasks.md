# Tasks: Comptabilité Analytique (Analytical Accounting) Module

**Input**: Design documents from `/specs/006-comptabilite-analytique/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Implementation Summary

| Phase | Name | Tasks | Completed | Percentage |
|-------|------|-------|-----------|------------|
| 1 | Foundation | 7 | 7 | 100% |
| 2 | Cost Analysis by Product | 4 | 4 | 100% |
| 3 | Order Profitability | 4 | 4 | 100% |
| 4 | Customer Profitability | 4 | 4 | 100% |
| 5 | Commercial Performance | 4 | 4 | 100% |
| 6 | DSO Tracking | 4 | 4 | 100% |
| 7 | Financial Dashboard | 3 | 3 | 100% |
| 8 | ROI Analysis | 4 | 4 | 100% |
| 9 | Export & Polish | 4 | 4 | 100% |
| 10 | Testing & Docs | 3 | 3 | 100% |

**Total**: 56 tasks | **Completed**: 56 | **Percentage**: 100%

---

## Phase 1: Foundation (Shared Infrastructure) - 100%

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

### T001 Create backend directory structure

- [x] ✅ Create `backend/src/models/comptabilite/` directory
- [x] ✅ Create `backend/src/services/comptabilite/` directory
- [x] ✅ Create `backend/src/controllers/comptabilite/` directory
- [x] ✅ Create `frontend/src/pages/comptabilite/` directory
- [x] ✅ Create `frontend/src/components/comptabilite/` directory
- [x] ✅ Create `frontend/src/services/` directory for API services

### T002 Configure decimal.js for financial calculations

- [x] ✅ Install decimal.js: `npm install decimal.js`
- [x] ✅ Create `backend/src/utils/decimal.ts` with configuration
- [x] ✅ Configure precision to 20 decimal places
- [x] ✅ Set rounding mode to ROUND_HALF_UP
- [x] ✅ Add type definitions for decimal operations

### T003 Create database migration

- [x] ✅ Create `backend/src/migrations/006-ComptabiliteModule.ts`
- [x] ✅ Create cost_component table
- [x] ✅ Create product_cost table
- [x] ✅ Create order_costing table
- [x] ✅ Create customer_profitability table
- [x] ✅ Create commercial_performance table
- [x] ✅ Create financial_kpi table
- [x] ✅ Create equipment_roi table
- [x] ✅ Create receivable_aging table
- [x] ✅ Add all required indexes

### T004 Implement CostComponent entity

- [x] ✅ Create `backend/src/models/comptabilite/CostComponent.ts`
- [x] ✅ Define fields: id, name, type, rate, unit, is_active, timestamps
- [x] ✅ Add TypeORM decorators and relations
- [x] ✅ Create enum for component type (material/labor/overhead)
- [x] ✅ Add validation decorators

### T005 Implement ProductCost entity

- [x] ✅ Create `backend/src/models/comptabilite/ProductCost.ts`
- [x] ✅ Define fields: id, profile_id, costs, calculated_at
- [x] ✅ Add relation to AluminumProfile
- [x] ✅ Add indexes for queries

### T006 Create CostCalculationService

- [x] ✅ Create `backend/src/services/comptabilite/CostCalculationService.ts`
- [x] ✅ Implement calculateProductCost() method
- [x] ✅ Implement material cost lookup
- [x] ✅ Implement labor cost calculation
- [x] ✅ Implement overhead allocation (ABC method)
- [x] ✅ Add decimal.js precision handling

### T007 Setup Redis caching for KPIs

- [x] ✅ Install Redis client if not already installed
- [x] ✅ Create `backend/src/config/kpi-cache.ts`
- [x] ✅ Implement cache wrapper with TTL
- [x] ✅ Configure cache invalidation on data change
- [x] ✅ Add cache warming on startup

---

## Phase 2: User Story 1 - Cost Analysis by Product - 100%

**Goal**: Calculate and display full cost structure for each aluminum profile

### T011 Create CostComponent CRUD API

- [x] ✅ Create CostComponentController
- [x] ✅ GET /api/comptabilite/cost-components (list all)
- [x] ✅ POST /api/comptabilite/cost-components (create)
- [x] ✅ PUT /api/comptabilite/cost-components/:id (update)
- [x] ✅ DELETE /api/comptabilite/cost-components/:id (soft delete)
- [x] ✅ Add validation and error handling

### T012 Create ProductCost API

- [x] ✅ Create ProductCostController
- [x] ✅ GET /api/comptabilite/product-costs (list all with pagination)
- [x] ✅ GET /api/comptabilite/product-costs/:profileId (single product)
- [x] ✅ POST /api/comptabilite/costs/recalculate (trigger recalculation)
- [x] ✅ Add sorting by total_cost

### T013 Create frontend cost components page

- [x] ✅ Create `frontend/src/pages/comptabilite/CostConfiguration.tsx`
- [x] ✅ Add form for creating/editing cost components
- [x] ✅ Add table listing all components
- [x] ✅ Add type filter (material/labor/overhead)
- [x] ✅ Add activation toggle

### T014 Create frontend product costs page

- [x] ✅ Create `frontend/src/pages/comptabilite/ProductCosts.tsx`
- [x] ✅ Add table with all products and costs
- [x] ✅ Add sorting by cost columns
- [x] ✅ Add cost breakdown tooltip/modal
- [x] ✅ Add export to Excel button

---

## Phase 3: User Story 2 - Profitability Analysis by Order - 100%

**Goal**: Calculate and display margin for each customer order

### T021 Implement OrderCosting entity

- [x] ✅ Create `backend/src/models/comptabilite/OrderCosting.ts`
- [x] ✅ Define fields: id, order_id, costs, revenue, margin, timestamps
- [x] ✅ Add relation to CustomerOrder
- [x] ✅ Add indexes

### T022 Create Order Costing Service

- [x] ✅ Create `backend/src/services/comptabilite/OrderCostingService.ts`
- [x] ✅ Implement calculateOrderCosting()
- [x] ✅ Implement margin calculation
- [x] ✅ Implement variance tracking (estimated vs actual)
- [x] ✅ Add webhook trigger on order completion

### T023 Create Order Costing API

- [x] ✅ Create OrderCostingController
- [x] ✅ GET /api/comptabilite/orders/:id/costing
- [x] ✅ GET /api/comptabilite/orders (list with margin sorting)
- [x] ✅ POST /api/comptabilite/orders/:id/recalculate-costing
- [x] ✅ Add margin variance reporting

### T024 Create frontend order profitability page

- [x] ✅ Create `frontend/src/pages/comptabilite/OrderProfitability.tsx`
- [x] ✅ Add table with orders and margins
- [x] ✅ Add low margin highlighting (configurable threshold)
- [x] ✅ Add variance indicator (green/red)
- [x] ✅ Add filter by date range

---

## Phase 4: User Story 3 - Customer Profitability Analysis - 100%

**Goal**: Aggregate profitability metrics per customer

### T031 Implement CustomerProfitability entity

- [x] ✅ Create `backend/src/models/comptabilite/CustomerProfitability.ts`
- [x] ✅ Define fields: id, customer_id, totals, order_count, timestamps
- [x] ✅ Add relation to Customer

### T032 Create ProfitabilityService

- [x] ✅ Create `backend/src/services/comptabilite/ProfitabilityService.ts`
- [x] ✅ Implement calculateCustomerProfitability()
- [x] ✅ Implement daily aggregation job
- [x] ✅ Add Redis caching for performance

### T033 Create Customer Profitability API

- [x] ✅ Create CustomerProfitabilityController
- [x] ✅ GET /api/comptabilite/customers/:id/profitability
- [x] ✅ GET /api/comptabilite/customers/profitability (list all)
- [x] ✅ Add sorting by margin_percent
- [x] ✅ Add filtering by margin threshold

### T034 Create frontend customer profitability page

- [x] ✅ Create `frontend/src/pages/comptabilite/CustomerProfitability.tsx`
- [x] ✅ Add table with customers and profitability
- [x] ✅ Add unprofitable customer highlighting
- [x] ✅ Add drill-down to customer orders
- [x] ✅ Add chart showing margin trend

---

## Phase 5: User Story 4 - Commercial Performance Tracking - 100%

**Goal**: Track and display sales rep performance

### T035 Implement CommercialPerformance entity

- [x] ✅ Create `backend/src/models/comptabilite/CommercialPerformance.ts`
- [x] ✅ Define fields: id, commercial_id, period, metrics, timestamps
- [x] ✅ Add relation to User (sales rep)

### T036 Create CommercialPerformanceService

- [x] ✅ Create `backend/src/services/comptabilite/CommercialPerformanceService.ts`
- [x] ✅ Implement calculateCommercialPerformance()
- [x] ✅ Implement conversion rate calculation
- [x] ✅ Implement achievement percentage

### T037 Create Commercial Performance API

- [x] ✅ Create CommercialPerformanceController
- [x] ✅ GET /api/comptabilite/commercials/:id/performance
- [x] ✅ GET /api/comptabilite/commercials/leaderboard
- [x] ✅ Add period filter (month/quarter/year)
- [x] ✅ Add target achievement reporting

### T038 Create frontend commercial performance page

- [x] ✅ Create `frontend/src/pages/comptabilite/CommercialPerformance.tsx`
- [x] ✅ Add leaderboard view
- [x] ✅ Add individual performance cards
- [x] ✅ Add conversion rate display
- [x] ✅ Add target vs actual comparison

---

## Phase 6: User Story 5 - DSO Tracking - 100%

**Goal**: Calculate and track Days Sales Outstanding

### T039 Implement ReceivableAging entity

- [x] ✅ Create `backend/src/models/comptabilite/ReceivableAging.ts`
- [x] ✅ Define fields: id, customer_id, period, aging buckets, timestamps

### T040 Implement FinancialKPI entity

- [x] ✅ Create `backend/src/models/comptabilite/FinancialKPI.ts`
- [x] ✅ Define fields: id, kpi_type, value, period, timestamps
- [x] ✅ Add enum for KPI types

### T041 Create KPIService

- [x] ✅ Create `backend/src/services/comptabilite/KPIService.ts`
- [x] ✅ Implement calculateDSO()
- [x] ✅ Implement calculateReceivableAging()
- [x] ✅ Implement daily KPI calculation job
- [x] ✅ Add Redis caching

### T042 Create DSO API

- [x] ✅ Create KPIController
- [x] ✅ GET /api/comptabilite/kpis/dso
- [x] ✅ GET /api/comptabilite/kpis/aging
- [x] ✅ GET /api/comptabilite/kpis/dashboard
- [x] ✅ Add trend data (historical)

---

## Phase 7: User Story 6 - Financial Dashboard - 100%

**Goal**: Executive overview of key financial metrics

### T043 Implement dashboard aggregation

- [x] ✅ Create dashboard service
- [x] ✅ Aggregate revenue (MTD/YTD)
- [x] ✅ Aggregate margins
- [x] ✅ Get current DSO
- [x] ✅ Get outstanding receivables

### T044 Create Financial Dashboard API

- [x] ✅ GET /api/comptabilite/kpis/dashboard
- [x] ✅ Include all required KPIs
- [x] ✅ Add drill-down endpoints

### T045 Create frontend financial dashboard

- [x] ✅ Create `frontend/src/pages/comptabilite/FinancialDashboard.tsx`
- [x] ✅ Add KPI cards (Revenue, Margin, DSO, Receivables)
- [x] ✅ Add trend charts
- [x] ✅ Add drill-down on click
- [x] ✅ Add real-time refresh

---

## Phase 8: User Story 7 - ROI Analysis - 100%

**Goal**: Calculate equipment investment returns

### T046 Implement EquipmentROI entity

- [x] ✅ Create `backend/src/models/comptabilite/EquipmentROI.ts`
- [x] ✅ Define fields: id, equipment_id, investment, benefit, roi, timestamps
- [x] ✅ Add relation to Machine

### T047 Create ROIService

- [x] ✅ Create `backend/src/services/comptabilite/ROIService.ts`
- [x] ✅ Implement calculateROI()
- [x] ✅ Implement calculatePayback()
- [x] ✅ Add scenario comparison

### T048 Create ROI API

- [x] ✅ Create ROIController
- [x] ✅ GET /api/comptabilite/roi/:equipmentId
- [x] ✅ POST /api/comptabilite/roi/calculate
- [x] ✅ GET /api/comptabilite/roi/compare

### T049 Create frontend ROI calculator

- [x] ✅ Create `frontend/src/pages/comptabilite/ROICalculator.tsx`
- [x] ✅ Add investment input form
- [x] ✅ Add benefit projections
- [x] ✅ Add ROI and payback display
- [x] ✅ Add comparison chart

---

## Phase 9: Frontend - Export & Polish - 100%

**Goal**: Complete user experience

### T050 Add PDF export

- [x] ✅ Install pdfmake or similar
- [x] ✅ Create report templates
- [x] ✅ Add export button to each page

### T051 Add Excel export

- [x] ✅ Install xlsx library
- [x] ✅ Create Excel export function
- [x] ✅ Add to reports

### T052 Add date range filters

- [x] ✅ Create reusable date picker component
- [x] ✅ Add to all relevant pages
- [x] ✅ Persist filter preferences

### T053 Responsive design

- [x] ✅ Test on mobile devices
- [x] ✅ Fix layout issues
- [x] ✅ Ensure usability

---

## Phase 10: Testing & Documentation - 100%

**Goal**: Ensure quality and maintainability

### T054 Write unit tests

- [x] ✅ Test CostCalculationService
- [x] ✅ Test ProfitabilityService
- [x] ✅ Test KPIService
- [x] ✅ Test ROIService

### T055 Write integration tests

- [x] ✅ Test API endpoints
- [x] ✅ Test data flow from orders to costing

### T056 Create API documentation

- [x] ✅ Add OpenAPI annotations
- [x] ✅ Generate API docs
- [x] ✅ Add examples

---

## Task Dependencies

| Task Range | Blocked By | Notes |
|------------|------------|-------|
| T011-T014 | T001-T007 | Need foundation first |
| T021-T024 | T011-T014 | Need cost components |
| T031-T034 | T021-T024 | Need order costing |
| T035-T038 | T031-T034 | Need customer profitability |
| T039-T042 | T035-T038 | Need commercial performance |
| T043-T045 | T039-T042 | Need KPIs first |
| T046-T049 | T043-T045 | Need dashboard first |
| T050-T053 | T046-T049 | Need base features first |
| T054-T056 | T050-T053 | Need implementation first |

---

## Checkpoints

- [x] Phase 1 Complete (T001-T007): 100%
- [x] Phase 2 Complete (T011-T014): 100%
- [x] Phase 3 Complete (T021-T024): 100%
- [x] Phase 4 Complete (T031-T034): 100%
- [x] Phase 5 Complete (T035-T038): 100%
- [x] Phase 6 Complete (T039-T042): 100%
- [x] Phase 7 Complete (T043-T045): 100%
- [x] Phase 8 Complete (T046-T049): 100%
- [x] Phase 9 Complete (T050-T053): 100%
- [x] Phase 10 Complete (T054-T056): 100%

---

**Total Tasks**: 56 | **Completed**: 56 | **Overall Percentage**: 100%
