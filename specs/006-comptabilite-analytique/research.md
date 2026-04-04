# Research: Comptabilité Analytique (Analytical Accounting) Module

**Feature**: 006-comptabilite-analytique  
**Date**: 2025-03-03  
**Status**: Complete

---

## Research Topics

### 1. Cost Calculation Methods

**Decision**: Use **actual costing** with configurable standard rates as fallback

**Rationale**:
- Actual costing provides accurate margin tracking per order
- Standard rates allow quick estimates before actual costs are known
- Hybrid approach balances accuracy with operational efficiency

**Implementation**:
- Material cost: Use actual purchase prices from inventory
- Labor cost: Track actual hours × labor rate
- Overhead: Use predetermined allocation rate (e.g., % of labor cost)

---

### 2. Overhead Allocation Methods

**Decision**: Use **activity-based costing (ABC)** with labor hours as primary driver

**Rationale**:
- More accurate than simple percentage-based allocation
- Aligns with aluminum industry practices
- Supports multiple allocation bases (labor hours, machine hours, material cost)

**Configuration Options**:
- labor_hours: Overhead = (total labor hours / allocated hours) × overhead rate
- machine_hours: Overhead = (total machine hours / allocated hours) × overhead rate
- material_cost: Overhead = (material cost / total material) × overhead pool

---

### 3. DSO Calculation Method

**Decision**: Use **weighted average** DSO formula

**Formula**:
```
DSO = (Accounts Receivable / Total Credit Sales) × Number of Days
```

**Rationale**:
- Industry standard method
- Accounts for seasonality
- Complies with French accounting standards

**Alternative Considered**:
- "Countback" method: More complex, better for monthly tracking but harder to explain

---

### 4. ROI Calculation Methods

**Decision**: Use **simple ROI** for equipment justification

**Formula**:
```
ROI (%) = (Annual Net Benefit / Investment Cost) × 100
Payback Period (years) = Investment Cost / Annual Cash Flow
```

**Rationale**:
- Simple and widely understood
- Suitable for capital budgeting in manufacturing
- Can be supplemented with NPV/IRR for complex decisions

**Alternatives Considered**:
- NPV (Net Present Value): Better for multi-year analysis with varying cash flows
- IRR (Internal Rate of Return): Useful for comparing investments of different sizes

---

### 5. Decimal Precision for Financial Calculations

**Decision**: Use **decimal.js** library with 4 decimal places for calculations, round to 2 for display

**Rationale**:
- JavaScript floating-point errors can cause calculation discrepancies
- Financial regulations require high precision
- decimal.js provides arbitrary precision decimal arithmetic

**Configuration**:
```typescript
import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
```

---

### 6. Reporting and Analytics

**Decision**: Use **in-memory aggregation** with Redis caching for dashboard KPIs

**Rationale**:
- Real-time calculations from PostgreSQL can be slow for large datasets
- Redis provides sub-millisecond access for cached KPIs
- Scheduled jobs can pre-compute daily/weekly metrics

**Caching Strategy**:
- Financial KPIs: Cache for 1 hour, refresh on data change
- Customer profitability: Daily refresh
- Commercial performance: Real-time (lightweight calculation)

---

### 7. Multi-Currency Support

**Decision**: Store in EUR, support display conversion via exchange rates

**Rationale**:
- Primary market is France/EU (EUR)
- Exchange rates are external data, not core to module
- Store historical rates for accurate reporting

**Implementation**:
- All amounts stored in base currency (EUR)
- Exchange rate table for conversion display
- Exchange rates updated daily (external API or manual entry)

---

## Technical Decisions Summary

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Costing Method | Actual with standard fallback | Accuracy + operational efficiency |
| Overhead Allocation | ABC with labor hours | Industry alignment |
| DSO Formula | Weighted average | Industry standard |
| ROI Method | Simple ROI | Easy to understand/use |
| Precision | decimal.js (4 dp) | Financial accuracy |
| Caching | Redis for KPIs | Performance |
| Currency | EUR base, display conversion | Primary market focus |

---

## References

- French GAAP (Plan Comptable Général)
- Activity-Based Costing best practices
- DSO calculation standards (DSO = (AR / Sales) × Days)
