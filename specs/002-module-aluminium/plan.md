# Implementation Plan: Aluminum Business Module

**Branch**: `002-module-aluminium` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-module-aluminium/spec.md`

## Summary

This plan implements the core Aluminum Business Module for the ERP Aluminium platform. The module provides aluminum profile catalog management with automatic calculations (surface area, weight, cost, margin), professional quote generation, and complete order-to-invoice workflow tracking. This is the **primary business module** that drives revenue and connects to all other modules.

**Technical approach**: Node.js/Express backend with TypeScript, TypeORM for data persistence, Puppeteer for PDF generation, and React frontend with form validation for aluminum-specific calculations.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.3  
**Primary Dependencies**: Express.js 4.x, TypeORM 0.3.x, Puppeteer 21.x (PDF generation), class-validator 0.14.x, decimal.js 10.x (precision calculations)  
**Storage**: PostgreSQL 15+ (primary), Redis 7+ (caching)  
**Testing**: Jest 29.x, Supertest 6.x  
**Target Platform**: Docker containers on Linux (development & production)  
**Project Type**: Web service (REST API + Frontend SPA)  
**Performance Goals**: < 5 seconds for quote generation with 10 line items, < 30 seconds for PDF generation  
**Constraints**: Calculation precision must be exact (0.1% tolerance), PDF must match company branding, French language support  
**Scale/Scope**: 1000+ aluminum profiles, 500+ quotes/month, 200+ orders/month

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain-Driven Design | ✅ PASS | Aluminum-specific entities (profiles, calculations, workflows) are first-class domain concepts |
| II. Security-First Architecture | ✅ PASS | RBAC enforcement (Commercial, Production roles), audit trails for all financial operations |
| III. Data Integrity & Traceability | ✅ PASS | Quote/Order status changes logged, pricing history preserved, calculations auditable |
| IV. Modular Monolith Architecture | ✅ PASS | Module exposes internal API only, depends on Auth module, provides API to Accounting/BI |
| V. Observability & Auditability | ✅ PASS | Dashboard KPIs for conversion rates, margin tracking, quote pipeline visibility |
| VI. Performance Standards | ✅ PASS | Targets defined: <5s quote generation, <30s PDF generation |
| VII. Specification-Driven Development | ✅ PASS | Spec complete with user stories, acceptance criteria, entity definitions |
| VIII. AI-Ready Architecture | ✅ PASS | Quote history, conversion data, pricing patterns available for future ML models |

**Gate Result**: ✅ ALL CHECKS PASSED - Proceeding to research phase

## Project Structure

### Documentation (this feature)

```text
specs/002-module-aluminium/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── aluminium-api.yaml    # OpenAPI specification
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
│   │   ├── AluminumProfile.ts
│   │   ├── Quote.ts
│   │   ├── QuoteLine.ts
│   │   ├── CustomerOrder.ts
│   │   ├── ProductionOrder.ts
│   │   ├── DeliveryNote.ts
│   │   ├── Invoice.ts
│   │   └── Customer.ts
│   ├── services/        # Business logic
│   │   ├── ProfileService.ts      # CRUD + calculations
│   │   ├── CalculationService.ts  # Surface, weight, cost formulas
│   │   ├── QuoteService.ts        # Quote generation + PDF
│   │   ├── OrderService.ts        # Order workflow
│   │   ├── ProductionService.ts   # Production tracking
│   │   └── InvoiceService.ts      # Invoice generation
│   ├── controllers/     # HTTP request handlers
│   │   ├── ProfileController.ts
│   │   ├── QuoteController.ts
│   │   ├── OrderController.ts
│   │   └── InvoiceController.ts
│   ├── routes/          # Route definitions
│   │   ├── profiles.routes.ts
│   │   ├── quotes.routes.ts
│   │   ├── orders.routes.ts
│   │   └── invoices.routes.ts
│   ├── utils/           # Helpers
│   │   ├── calculations.ts    # Aluminum formulas
│   │   ├── pdf-generator.ts   # Puppeteer PDF generation
│   │   └── validators.ts      # Domain validation
│   └── app.ts           # Express app setup
├── tests/
│   ├── unit/            # Service logic tests
│   ├── integration/     # API integration tests
│   └── contract/        # Contract tests

frontend/
├── src/
│   ├── components/
│   │   ├── profiles/    # Profile CRUD components
│   │   ├── quotes/      # Quote builder components
│   │   └── orders/      # Order management components
│   ├── pages/
│   │   ├── ProfileList.tsx
│   │   ├── ProfileForm.tsx
│   │   ├── QuoteBuilder.tsx
│   │   ├── QuoteList.tsx
│   │   └── OrderList.tsx
│   ├── services/
│   │   ├── profile.service.ts
│   │   ├── quote.service.ts
│   │   └── order.service.ts
│   └── types/
│       └── aluminium.types.ts
```

**Structure Decision**: Web application with separate backend (Node.js/Express) and frontend (React), following the established pattern from 001-auth-security.

## Complexity Tracking

> No constitution violations requiring justification.

## Implementation Phases

### Phase 0: Research & Unknowns

**Goal**: Resolve all technical unknowns before design

**Research Areas**:
1. PDF generation libraries comparison (Puppeteer vs PDFKit vs jsPDF)
2. Decimal precision handling for financial calculations
3. Aluminum profile geometry formulas for different types
4. Quote workflow state machine patterns

**Output**: `research.md` with decisions and rationale

### Phase 1: Design & Contracts

**Goal**: Define data models, API contracts, and implementation guide

**Tasks**:
1. Extract entities from spec → `data-model.md`
2. Define API contracts → `contracts/aluminium-api.yaml`
3. Document workflow states → `contracts/workflows.md`
4. Create implementation guide → `quickstart.md`

**Output**: data-model.md, contracts/, quickstart.md

### Phase 2: Task Breakdown

**Goal**: Create implementation tasks

*Note: This phase is executed by `/speckit.tasks` command, not this plan.*

## Dependencies

### Required By This Module
- `001-auth-security`: Authentication, RBAC (Commercial, Production roles)

### Modules Depending On This
- `003-module-stock`: Inventory integration with orders
- `006-comptabilite-analytique`: Revenue and margin tracking
- `007-bi-dashboard`: Sales KPIs and conversion metrics
- `008-ai-module`: Quote prediction and pricing optimization

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Calculation precision errors | Medium | High | Use Decimal.js, extensive unit testing, 0.1% tolerance validation |
| PDF generation performance | Medium | Medium | Implement caching, async queue for large documents |
| Complex quote workflow bugs | Medium | High | State machine pattern, comprehensive integration tests |

## Timeline Estimate

- Phase 0 (Research): 2 days
- Phase 1 (Design): 3 days
- Phase 2 (Task breakdown): 1 day
- Implementation (estimated): 4-6 weeks

---

**Plan Version**: 1.0.0 | **Last Updated**: 2026-03-04
