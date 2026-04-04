# Data Model: Comptabilité Analytique (Analytical Accounting) Module

**Feature**: 006-comptabilite-analytique  
**Date**: 2025-03-03  
**ORM**: TypeORM 0.3.x

---

## Entity Relationship Diagram

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     CostComponent      │     │    AluminumProfile     │
├─────────────────────────┤     ├─────────────────────────┤
│ PK id: UUID            │     │ PK id: UUID             │
│ name: string           │     │ (from aluminium module) │
│ type: enum             │     └───────────┬─────────────┘
│   (material/labor/     │                 │
│    overhead)           │                 │ 1:1
│ rate: decimal          │                 ▼
│ unit: string           │     ┌─────────────────────────┐
│ is_active: boolean     │     │      ProductCost        │
│ created_at: timestamp  │     ├─────────────────────────┤
│ updated_at: timestamp  │     │ PK id: UUID             │
└─────────────────────────┘     │ FK profile_id: UUID    │
                               │ material_cost: decimal  │
                               │ labor_cost: decimal    │
                               │ overhead_cost: decimal │
                               │ total_cost: decimal    │
                               │ calculated_at: timestamp│
                               └─────────────────────────┘

┌─────────────────────────┐     ┌─────────────────────────┐
│     CustomerOrder       │     │     OrderCosting        │
├─────────────────────────┤     ├─────────────────────────┤
│ PK id: UUID             │     │ PK id: UUID             │
│ (from aluminium module)│────▶│ FK order_id: UUID       │
└───────────┬─────────────┘     │ material_cost: decimal  │
            │                   │ labor_cost: decimal    │
            │ 1:1               │ overhead_cost: decimal  │
            ▼                   │ total_cost: decimal    │
┌─────────────────────────┐     │ revenue: decimal       │
│   CustomerProfitability │     │ margin: decimal        │
├─────────────────────────┤     │ margin_percent: decimal│
│ PK id: UUID             │     │ estimated_margin: dec. │
│ FK customer_id: UUID    │     │ actual_margin: decimal │
│ total_revenue: decimal │     │ margin_variance: dec.  │
│ total_cost: decimal    │     │ calculated_at: timestamp│
│ total_margin: decimal  │     └─────────────────────────┘
│ margin_percent: decimal │
│ order_count: integer   │
│ calculated_at: timestamp│
└─────────────────────────┘

┌─────────────────────────┐     ┌─────────────────────────┐
│         User            │     │  CommercialPerformance  │
├─────────────────────────┤     ├─────────────────────────┤
│ PK id: UUID             │     │ PK id: UUID             │
│ (from auth module)     │────▶│ FK commercial_id: UUID  │
└─────────────────────────┘     │ period_start: date     │
                               │ period_end: date       │
                               │ revenue: decimal       │
                               │ order_count: integer   │
                               │ margin: decimal        │
                               │ conversion_rate: dec. │
                               │ target_revenue: decimal│
                               │ achievement_pct: dec.  │
                               │ calculated_at: timestamp│
                               └─────────────────────────┘

┌─────────────────────────┐     ┌─────────────────────────┐
│     FinancialKPI        │     │      EquipmentROI       │
├─────────────────────────┤     ├─────────────────────────┤
│ PK id: UUID            │     │ PK id: UUID             │
│ kpi_type: enum         │     │ FK equipment_id: UUID  │
│   (revenue_gross,      │     │ (from maintenance mod)  │
│    revenue_net,        │     │ investment_cost: decimal│
│    margin_gross,       │     │ annual_benefit: decimal │
│    margin_net,         │     │ roi_percent: decimal    │
│    dso,                │     │ payback_years: decimal  │
│    receivables)        │     │ calculated_at: timestamp│
│ value: decimal         │     └─────────────────────────┘
│ period: string         │
│   (month/quarter/year) │
│ calculated_at: timestamp│
└─────────────────────────┘

┌─────────────────────────┐
│   ReceivableAging      │
├─────────────────────────┤
│ PK id: UUID             │
│ FK customer_id: UUID    │
│ period: date            │
│ aging_0_30: decimal    │
│ aging_31_60: decimal   │
│ aging_61_90: decimal    │
│ aging_90_plus: decimal  │
│ total: decimal          │
│ calculated_at: timestamp│
└─────────────────────────┘
```

---

## Entity Definitions

### CostComponent

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| name | string | NOT NULL | Component name (e.g., "Aluminum Alloy 6063") |
| type | enum | NOT NULL | material, labor, or overhead |
| rate | decimal(10,2) | NOT NULL | Cost per unit |
| unit | string | NOT NULL | Unit of measurement (e.g., "kg", "hour") |
| is_active | boolean | DEFAULT true | Whether component is active |
| created_at | timestamp | NOT NULL | Creation timestamp |
| updated_at | timestamp | NOT NULL | Last update timestamp |

### ProductCost

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| profile_id | UUID | FK, NOT NULL | Reference to AluminumProfile |
| material_cost | decimal(12,2) | NOT NULL | Material cost for this profile |
| labor_cost | decimal(12,2) | NOT NULL | Labor cost for this profile |
| overhead_cost | decimal(12,2) | NOT NULL | Overhead allocation |
| total_cost | decimal(12,2) | NOT NULL | Sum of all costs |
| calculated_at | timestamp | NOT NULL | Calculation timestamp |

### OrderCosting

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| order_id | UUID | FK, NOT NULL | Reference to CustomerOrder |
| material_cost | decimal(12,2) | NOT NULL | Actual material cost |
| labor_cost | decimal(12,2) | NOT NULL | Actual labor cost |
| overhead_cost | decimal(12,2) | NOT NULL | Overhead allocation |
| total_cost | decimal(12,2) | NOT NULL | Total cost |
| revenue | decimal(12,2) | NOT NULL | Order revenue |
| margin | decimal(12,2) | NOT NULL | Revenue - total_cost |
| margin_percent | decimal(5,2) | NOT NULL | (margin / revenue) * 100 |
| estimated_margin | decimal(12,2) | NULL | Original quote margin |
| actual_margin | decimal(12,2) | NULL | Actual margin after completion |
| margin_variance | decimal(12,2) | NULL | Actual - estimated |
| calculated_at | timestamp | NOT NULL | Calculation timestamp |

### CustomerProfitability

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| customer_id | UUID | FK, NOT NULL | Reference to Customer |
| total_revenue | decimal(14,2) | NOT NULL | Sum of all order revenues |
| total_cost | decimal(14,2) | NOT NULL | Sum of all order costs |
| total_margin | decimal(14,2) | NOT NULL | Revenue - cost |
| margin_percent | decimal(5,2) | NOT NULL | (margin / revenue) * 100 |
| order_count | integer | NOT NULL | Number of orders |
| calculated_at | timestamp | NOT NULL | Calculation timestamp |

### CommercialPerformance

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| commercial_id | UUID | FK, NOT NULL | Reference to User (sales rep) |
| period_start | date | NOT NULL | Performance period start |
| period_end | date | NOT NULL | Performance period end |
| revenue | decimal(14,2) | NOT NULL | Total revenue generated |
| order_count | integer | NOT NULL | Number of closed orders |
| margin | decimal(14,2) | NOT NULL | Total margin contributed |
| conversion_rate | decimal(5,2) | NOT NULL | Orders / Quotes sent * 100 |
| target_revenue | decimal(14,2) | NULL | Revenue target for period |
| achievement_pct | decimal(5,2) | NULL | (revenue / target) * 100 |
| calculated_at | timestamp | NOT NULL | Calculation timestamp |

### FinancialKPI

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| kpi_type | enum | NOT NULL | revenue_gross, revenue_net, margin_gross, margin_net, dso, receivables |
| value | decimal(14,2) | NOT NULL | KPI value |
| period | string | NOT NULL | month, quarter, or year |
| calculated_at | timestamp | NOT NULL | Calculation timestamp |

### EquipmentROI

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| equipment_id | UUID | FK, NOT NULL | Reference to Machine |
| investment_cost | decimal(14,2) | NOT NULL | Total capital invested |
| annual_benefit | decimal(14,2) | NOT NULL | Annual profit/generated value |
| roi_percent | decimal(8,2) | NOT NULL | (annual_benefit / investment) * 100 |
| payback_years | decimal(6,2) | NOT NULL | investment / annual_benefit |
| calculated_at | timestamp | NOT NULL | Calculation timestamp |

### ReceivableAging

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| customer_id | UUID | FK, NOT NULL | Reference to Customer |
| period | date | NOT NULL | Period for aging report |
| aging_0_30 | decimal(14,2) | NOT NULL | Receivables 0-30 days old |
| aging_31_60 | decimal(14,2) | NOT NULL | Receivables 31-60 days old |
| aging_61_90 | decimal(14,2) | NOT NULL | Receivables 61-90 days old |
| aging_90_plus | decimal(14,2) | NOT NULL | Receivables over 90 days |
| total | decimal(14,2) | NOT NULL | Sum of all aging buckets |
| calculated_at | timestamp | NOT NULL | Calculation timestamp |

---

## Database Indexes

```sql
-- ProductCost indexes
CREATE INDEX idx_product_cost_profile ON product_cost(profile_id);
CREATE INDEX idx_product_cost_calculated ON product_cost(calculated_at);

-- OrderCosting indexes
CREATE INDEX idx_order_costing_order ON order_costing(order_id);
CREATE INDEX idx_order_costing_margin ON order_costing(margin_percent);

-- CustomerProfitability indexes
CREATE INDEX idx_customer_profit_customer ON customer_profitability(customer_id);
CREATE INDEX idx_customer_profit_calculated ON customer_profitability(calculated_at);

-- CommercialPerformance indexes
CREATE INDEX idx_commercial_perf_user ON commercial_performance(commercial_id);
CREATE INDEX idx_commercial_perf_period ON commercial_performance(period_start, period_end);

-- FinancialKPI indexes
CREATE INDEX idx_financial_kpi_type ON financial_kpi(kpi_type);
CREATE INDEX idx_financial_kpi_period ON financial_kpi(period);

-- EquipmentROI indexes
CREATE INDEX idx_equipment_roi_equipment ON equipment_roi(equipment_id);

-- ReceivableAging indexes
CREATE INDEX idx_receivable_aging_customer ON receivable_aging(customer_id);
CREATE INDEX idx_receivable_aging_period ON receivable_aging(period);
```

---

## Migration Strategy

1. Create base tables: CostComponent, ProductCost
2. Add OrderCosting linked to existing CustomerOrder
3. Add CustomerProfitability linked to existing Customer
4. Add CommercialPerformance linked to existing User
5. Add FinancialKPI for tracking
6. Add EquipmentROI linked to existing Machine
7. Add ReceivableAging for DSO calculations
