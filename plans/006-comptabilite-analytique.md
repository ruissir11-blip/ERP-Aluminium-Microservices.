# Feature Specification: Module E — Comptabilité Analytique (Analytical Accounting)

**Feature Branch**: `006-comptabilite-analytique`  
**Created**: 2025-03-03  
**Status**: Ready for Implementation  
**Spec Location**: [`specs/006-comptabilite-analytique/`](../specs/006-comptabilite-analytique/)

---

## Overview

This plan implements the Analytical Accounting module for the ERP Aluminium platform. The module provides cost analysis, profitability tracking by product/order/customer/commercial, financial KPIs (CA, margin, DSO), and ROI analysis.

**Technical Stack**: Node.js 20 LTS + TypeScript 5.3, Express.js 4.x, TypeORM 0.3.x, Redis 7.x, decimal.js 10.x

---

## Dependencies

### Required (Must Complete First)

| Module | Status | Notes |
|--------|--------|-------|
| 001-auth-security | ✅ Complete | User authentication, roles, permissions |
| 002-module-aluminium | ✅ Complete | Orders, customers, products |
| 003-module-stock | ✅ Complete | Inventory and material costs |
| 005-module-qualite | 🔄 In Progress | Quality module (optional integration) |

### Required By

| Module | Dependency | Reason |
|--------|------------|--------|
| 007-bi-dashboard | Provides KPIs | Financial data for BI |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Core infrastructure and data model

| Task | Description | Deliverable |
|------|-------------|-------------|
| T001 | Create backend directory structure | Directories: models/comptabilite, services/comptabilite, controllers/comptabilite |
| T002 | Configure decimal.js | Precision utils for financial calculations |
| T003 | Database migration | 8 new tables for analytical accounting |
| T004 | CostComponent entity | CRUD for cost components |
| T005 | ProductCost entity | Product cost storage |
| T006 | CostCalculationService | ABC costing logic |
| T007 | Redis caching | KPI cache wrapper |

### Phase 2: Product Cost Analysis (Week 2)

**Goal**: Calculate costs per aluminum profile

| Task | Description | Deliverable |
|------|-------------|-------------|
| T011 | CostComponent CRUD API | REST endpoints |
| T012 | ProductCost API | Cost查询 endpoints |
| T013 | Frontend: Cost config page | Manage cost components |
| T014 | Frontend: Product costs page | View product costs |

### Phase 3: Order Profitability (Week 3)

**Goal**: Margin tracking per order

| Task | Description | Deliverable |
|------|-------------|-------------|
| T021 | OrderCosting entity | Order margin storage |
| T022 | OrderCostingService | Margin calculation |
| T023 | Order Costing API | Endpoints for costing |
| T024 | Frontend: Order profitability | Margin reports |

### Phase 4: Customer & Commercial (Week 4)

**Goal**: Profitability analysis

| Task | Description | Deliverable |
|------|-------------|-------------|
| T031 | CustomerProfitability entity | Customer aggregation |
| T032 | ProfitabilityService | Daily aggregation |
| T033 | Customer API | Profitability endpoints |
| T041 | CommercialPerformance entity | Sales rep metrics |
| T042 | CommercialPerformanceService | Performance calculation |
| T043 | Commercial API | Leaderboard, metrics |

### Phase 5: Financial KPIs (Week 5)

**Goal**: Dashboard and reporting

| Task | Description | Deliverable |
|------|-------------|-------------|
| T051 | ReceivableAging entity | Aging buckets |
| T052 | FinancialKPI entity | KPI storage |
| T053 | KPIService | DSO, aging, aggregations |
| T054 | KPI API | Dashboard endpoints |
| T061 | Dashboard aggregation | MTD/YTD metrics |
| T062 | Dashboard API | Single endpoint for UI |

### Phase 6: ROI Analysis (Week 6)

**Goal**: Equipment investment returns

| Task | Description | Deliverable |
|------|-------------|-------------|
| T071 | EquipmentROI entity | ROI storage |
| T072 | ROIService | ROI calculations |
| T073 | ROI API | Calculator endpoints |
| T074 | Frontend: ROI calculator | Investment tool |

### Phase 7: Frontend & Polish (Week 7)

**Goal**: Complete user experience

| Task | Description | Deliverable |
|------|-------------|-------------|
| T081 | PDF export | Report generation |
| T082 | Excel export | Spreadsheet export |
| T083 | Date filters | Reusable filter |
| T084 | Responsive design | Mobile support |

### Phase 8: Testing (Week 8)

**Goal**: Quality assurance

| Task | Description | Deliverable |
|------|-------------|-------------|
| T091 | Unit tests | Service test coverage |
| T092 | Integration tests | API test coverage |
| T093 | API documentation | OpenAPI specs |

---

## Key Entities

```
CostComponent          → ProductCost          → AluminumProfile
CustomerOrder          → OrderCosting
Customer               → CustomerProfitability
User (commercial)      → CommercialPerformance
Invoice                → FinancialKPI
Machine                → EquipmentROI
Invoice                → ReceivableAging
```

---

## API Summary

### Cost Management
- `GET/POST /api/comptabilite/cost-components`
- `PUT/DELETE /api/comptabilite/cost-components/:id`
- `GET /api/comptabilite/product-costs`
- `POST /api/comptabilite/costs/recalculate`

### Profitability
- `GET /api/comptabilite/orders/:id/costing`
- `GET /api/comptabilite/customers/:id/profitability`
- `GET /api/comptabilite/customers/profitability`
- `GET /api/comptabilite/commercials/:id/performance`
- `GET /api/comptabilite/commercials/leaderboard`

### KPIs & Dashboard
- `GET /api/comptabilite/kpis/dashboard`
- `GET /api/comptabilite/kpis/dso`
- `GET /api/comptabilite/kpis/aging`

### ROI
- `GET /api/comptabilite/roi/:equipmentId`
- `POST /api/comptabilite/roi/calculate`

---

## Success Criteria

- [ ] Product costs calculated automatically from cost components
- [ ] Order margin available within 1 hour of order completion
- [ ] DSO calculated and updated daily
- [ ] Financial dashboard loads within 3 seconds
- [ ] All reports accurate to within 0.1%

---

## File References

| Document | Location |
|----------|----------|
| Specification | [`specs/006-comptabilite-analytique/spec.md`](../specs/006-comptabilite-analytique/spec.md) |
| Data Model | [`specs/006-comptabilite-analytique/data-model.md`](../specs/006-comptabilite-analytique/data-model.md) |
| Research | [`specs/006-comptabilite-analytique/research.md`](../specs/006-comptabilite-analytique/research.md) |
| Quickstart | [`specs/006-comptabilite-analytique/quickstart.md`](../specs/006-comptabilite-analytique/quickstart.md) |
| Implementation Plan | [`specs/006-comptabilite-analytique/plan.md`](../specs/006-comptabilite-analytique/plan.md) |
| Tasks | [`specs/006-comptabilite-analytique/tasks.md`](../specs/006-comptabilite-analytique/tasks.md) |
| Requirements Checklist | [`specs/006-comptabilite-analytique/checklists/requirements.md`](../specs/006-comptabilite-analytique/checklists/requirements.md) |
| API Contract | [`specs/006-comptabilite-analytique/contracts/comptabilite-api.yaml`](../specs/006-comptabilite-analytique/contracts/comptabilite-api.yaml) |

---

## Next Steps

1. Begin Phase 1: Foundation implementation
2. Create database migration
3. Implement CostComponent entity
4. Set up decimal.js utilities
