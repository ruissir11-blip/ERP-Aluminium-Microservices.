# Implementation Plan: Comptabilité Analytique (Analytical Accounting) Module

**Branch**: `006-comptabilite-analytique` | **Date**: 2025-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-comptabilite-analytique/spec.md`

## Summary

This plan implements the Analytical Accounting module for the ERP Aluminium platform. The module provides cost analysis by product, profitability tracking by order/customer/commercial, financial KPIs (CA, margin, DSO), and ROI analysis. This module builds on the aluminium orders module and integrates with the quality module for complete cost tracking.

**Technical approach**: Node.js/Express backend with TypeScript, PostgreSQL for persistence, Redis for KPI caching, and decimal.js for precision calculations.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.3
**Primary Dependencies**: Express.js 4.x, TypeORM 0.3.x, decimal.js 10.x, node-cron 3.x
**Storage**: PostgreSQL 15+ (primary), Redis 7+ (KPI cache)
**Testing**: Jest 29.x, Supertest 6.x
**Target Platform**: Docker containers on Linux (development & production)
**Project Type**: Web service (REST API + Frontend SPA)
**Performance Goals**: Dashboard load < 3s, support 50 concurrent users
**Constraints**: Must support French accounting standards, EUR currency
**Scale/Scope**: 50 concurrent users, 1000 customers, 10k orders

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain-Driven Design | ✅ PASS | Cost analysis is core financial domain |
| II. Security-First Architecture | ✅ PASS | Role-based access to financial data |
| III. Data Integrity & Traceability | ✅ PASS | Audit trail on all cost changes |
| IV. Modular Monolith Architecture | ✅ PASS | Analytical module as separate bounded context |
| V. Observability & Auditability | ✅ PASS | Cost calculation logging |
| VI. Performance Standards | ✅ PASS | < 3s dashboard target |
| VII. Specification-Driven Development | ✅ PASS | Spec complete with user stories |
| VIII. AI-Ready Architecture | ✅ PASS | Structured financial data for future analytics |

**Gate Result**: ✅ ALL CHECKS PASSED - Proceeding to research phase

## Project Structure

### Documentation (this feature)

```text
specs/006-comptabilite-analytique/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Getting started guide
├── tasks.md             # Implementation tasks
├── checklists/
│   └── requirements.md  # Requirements checklist
└── contracts/
    └── comptabilite-api.yaml  # API specification
```

### Backend Code

```text
backend/src/
├── models/
│   └── comptabilite/
│       ├── CostComponent.ts
│       ├── ProductCost.ts
│       ├── OrderCosting.ts
│       ├── CustomerProfitability.ts
│       ├── CommercialPerformance.ts
│       ├── FinancialKPI.ts
│       ├── EquipmentROI.ts
│       └── ReceivableAging.ts
├── services/
│   └── comptabilite/
│       ├── CostCalculationService.ts
│       ├── ProfitabilityService.ts
│       ├── KPIService.ts
│       └── ROIService.ts
├── controllers/
│   └── comptabilite/
│       ├── CostController.ts
│       ├── ProfitabilityController.ts
│       ├── KPIController.ts
│       └── ROIController.ts
├── routes/
│   └── comptabilite.routes.ts
└── migrations/
    └── 006-ComptabiliteModule.ts
```

### Frontend Code

```text
frontend/src/
├── pages/
│   └── comptabilite/
│       ├── CostAnalysis.tsx
│       ├── ProfitabilityDashboard.tsx
│       ├── CommercialPerformance.tsx
│       └── ROICalculator.tsx
├── components/
│   └── comptabilite/
│       ├── CostBreakdownChart.tsx
│       ├── MarginIndicator.tsx
│       ├── DSOTracker.tsx
│       └── FinancialKPICard.tsx
└── services/
    └── comptabiliteApi.ts
```

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Core infrastructure and data model

1. Create database migration for all analytical accounting tables
2. Implement CostComponent entity with CRUD
3. Implement ProductCost entity and calculation logic
4. Set up Redis caching for KPIs
5. Create base API routes and controllers

**Deliverables**:
- Database migration complete
- Cost component management API
- Product cost calculation service
- Redis caching configured

### Phase 2: Order Costing (Week 2)

**Goal**: Calculate margins per order

1. Implement OrderCosting entity
2. Create order completion hook for automatic costing
3. Implement margin variance tracking (estimated vs actual)
4. Add order profitability API endpoints

**Deliverables**:
- Order costing on order completion
- Margin reports by order
- Variance analysis

### Phase 3: Customer & Commercial Analysis (Week 3)

**Goal**: Profitability by customer and sales rep

1. Implement CustomerProfitability entity and aggregation
2. Implement CommercialPerformance entity and calculations
3. Create customer profitability dashboard
4. Create commercial leaderboard/performance views

**Deliverables**:
- Customer profitability reports
- Commercial performance tracking
- Conversion rate calculations

### Phase 4: Financial KPIs (Week 4)

**Goal**: Dashboard and reporting

1. Implement FinancialKPI entity with daily calculations
2. Implement ReceivableAging and DSO tracking
3. Create financial dashboard API
4. Add chart components for frontend

**Deliverables**:
- Financial dashboard with all KPIs
- DSO tracking and trends
- Receivable aging reports

### Phase 5: ROI Analysis (Week 5)

**Goal**: Equipment investment analysis

1. Implement EquipmentROI entity
2. Create ROI calculation service
3. Add equipment investment tracking
4. Create ROI comparison tools

**Deliverables**:
- Equipment ROI calculator
- Payback period tracking
- Investment comparison reports

### Phase 6: Frontend Integration (Week 6)

**Goal**: Complete user interface

1. Build cost analysis pages
2. Build profitability dashboards
3. Build commercial performance views
4. Build financial dashboard
5. Add export functionality (PDF/Excel)

**Deliverables**:
- Complete analytical accounting UI
- All reports exportable
- Responsive design

## Dependencies

### Required (Must complete first)

| Module | Dependency | Reason |
|--------|------------|--------|
| 001-auth-security | Required | User authentication, roles, permissions |
| 002-module-aluminium | Required | Orders, customers, products |
| 003-module-stock | Required | Material costs from inventory |

### Optional (Can integrate later)

| Module | Integration | Reason |
|--------|-------------|--------|
| 005-module-qualite | Quality costs | Include quality costs in product cost |
| 007-bi-dashboard | Financial KPIs | Provide data for BI dashboard |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cost data incomplete | Medium | Add manual cost entry as fallback |
| Performance with large datasets | High | Use Redis caching, pagination |
| Decimal precision errors | High | Use decimal.js for all calculations |
| Integration with orders | Medium | Webhook on order completion |

## Success Metrics

- [ ] Product costs calculated within 1 hour of cost component change
- [ ] Order margins available within 1 hour of order completion
- [ ] Dashboard loads in < 3 seconds
- [ ] DSO calculated and cached daily
- [ ] All reports accurate to 0.1%

## Next Steps

1. Complete research phase (already done)
2. Begin Phase 1: Foundation implementation
3. Review tasks.md for detailed work items
