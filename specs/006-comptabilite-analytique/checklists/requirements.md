# Requirements Checklist: Comptabilité Analytique Module

**Feature**: 006-comptabilite-analytique
**Date**: 2025-03-03

---

## Functional Requirements Verification

### Cost Analysis (User Story 1)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| FR-001 | Calculate product cost = material + labor + overhead | ⬜ | Unit test with known inputs |
| FR-002 | Support configurable labor rates | ⬜ | Update rate, verify recalculation |
| FR-002 | Support overhead allocation methods | ⬜ | Test each ABC method |
| - | Sortable by total cost | ⬜ | UI test |
| - | Automatic recalculation on rate change | ⬜ | Update rate, check product cost |

### Order Profitability (User Story 2)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| FR-003 | Calculate order margin = revenue − costs | ⬜ | Compare to manual calculation |
| FR-004 | Calculate gross/net margin % | ⬜ | Verify formula |
| - | Sortable by margin | ⬜ | UI test |
| - | Variance (estimated vs actual) shown | ⬜ | Complete order, verify variance |

### Customer Profitability (User Story 3)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| FR-005 | Aggregate customer profitability | ⬜ | Sum orders, compare to API |
| - | Shows: revenue, cost, margin, order count | ⬜ | UI verification |
| - | Flag customers with margin < 10% | ⬜ | Create low-margin customer |

### Commercial Performance (User Story 4)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| FR-006 | Calculate commercial performance | ⬜ | Compare to manual calculation |
| - | Revenue by commercial | ⬜ | Verify sum |
| - | Conversion rate calculation | ⬜ | Test with known quotes/orders |
| - | Leaderboard ranking | ⬜ | UI test |

### DSO Tracking (User Story 5)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| FR-007 | Calculate DSO formula | ⬜ | Test with known AR/revenue |
| FR-008 | Track receivable aging (0-30, 31-60, 61-90, 90+) | ⬜ | Create invoices, verify aging |
| - | DSO target variance highlighted | ⬜ | Set target, exceed it |
| - | DSO trend visible | ⬜ | Check historical data |

### Financial Dashboard (User Story 6)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| - | Revenue MTD/YTD | ⬜ | Compare to sum |
| - | Gross Margin % | ⬜ | Verify calculation |
| - | Net Margin % | ⬜ | Verify calculation |
| - | DSO display | ⬜ | UI verification |
| - | Outstanding Receivables | ⬜ | Compare to invoice sum |
| - | Drill-down on click | ⬜ | UI test |
| - | P&L auto-generation | ⬜ | Generate report |

### ROI Analysis (User Story 7)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| FR-009 | Calculate ROI % | ⬜ | Test with known values |
| FR-010 | Calculate payback period | ⬜ | Verify formula |
| - | Scenario comparison | ⬜ | Enter multiple scenarios |

### Trend Analysis (User Story 8)

| ID | Requirement | Status | Verification Method |
|----|-------------|--------|---------------------|
| FR-011 | Budget vs actual variance | ⬜ | Set budget, compare |
| - | Trend chart display | ⬜ | UI verification |
| - | Forecast (linear regression) | ⬜ | Verify prediction |

---

## Non-Functional Requirements

| Requirement | Target | Status | Verification |
|-------------|--------|--------|--------------|
| Dashboard load time | < 3s | ⬜ | Performance test |
| Calculation accuracy | 0.1% | ⬜ | Compare to accounting |
| Concurrent users | 50 | ⬜ | Load test |
| Export to PDF | Available | ⬜ | Test export |
| Export to Excel | Available | ⬜ | Test export |

---

## Integration Requirements

| Integration | Requirement | Status | Verification |
|-------------|-------------|--------|--------------|
| 001-auth-security | User authentication | ⬜ | Login required |
| 001-auth-security | Role-based access | ⬜ | Test permissions |
| 002-module-aluminium | Order data | ⬜ | Costing from orders |
| 002-module-aluminium | Customer data | ⬜ | Profitability from customers |
| 002-module-aluminium | Product data | ⬜ | Product costs |
| 005-module-qualite | Quality costs (optional) | ⬜ | Include if available |

---

## Data Model Requirements

| Entity | Required Fields | Status |
|--------|-----------------|--------|
| CostComponent | id, name, type, rate, unit, is_active | ⬜ |
| ProductCost | id, profile_id, costs, total, calculated_at | ⬜ |
| OrderCosting | id, order_id, costs, revenue, margin | ⬜ |
| CustomerProfitability | id, customer_id, totals, order_count | ⬜ |
| CommercialPerformance | id, commercial_id, period, metrics | ⬜ |
| FinancialKPI | id, kpi_type, value, period | ⬜ |
| EquipmentROI | id, equipment_id, investment, benefit, roi | ⬜ |
| ReceivableAging | id, customer_id, aging buckets | ⬜ |

---

## Acceptance Criteria Summary

- [ ] All 8 user stories implemented
- [ ] All functional requirements met
- [ ] All non-functional requirements met
- [ ] Integration with required modules
- [ ] All data entities complete
- [ ] Dashboard loads < 3 seconds
- [ ] Calculations accurate to 0.1%
- [ ] Exports working (PDF, Excel)
- [ ] Unit tests passing
- [ ] Integration tests passing
