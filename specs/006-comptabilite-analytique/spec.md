# Feature Specification: Module E — Comptabilité Analytique (Analytical Accounting)

**Feature Branch**: `006-comptabilite-analytique`  
**Created**: 2025-03-03  
**Status**: Draft  
**Input**: User description: "Analytical accounting module for cost analysis, profitability tracking by product/command/customer/commercial, financial KPIs (CA, marge, DSO), and ROI analysis for the aluminum ERP"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cost Analysis by Product (Priority: P1)

As a finance manager, I want to analyze the full cost structure of each aluminum profile, so that I can understand profitability and set appropriate prices.

**Why this priority**: Essential for pricing decisions and profitability analysis.

**Independent Test**: Can be tested by generating cost reports and verifying calculations.

**Acceptance Scenarios**:

1. **Given** profile X: material cost €30, labor 2h at €25/h = €50, overheads €20, **When** calculating total cost, **Then** cost of goods = €100
2. **Given** cost report for all profiles, **When** viewing, **Then** profiles are sortable by total cost
3. **Given** cost components need updating, **When** modifying labor rate, **Then** all product costs recalculate automatically

---

### User Story 2 - Profitability Analysis by Order (Priority: P1)

As a commercial director, I want to see the actual margin on each customer order, so that I can verify profitability and identify unprofitable deals.

**Why this priority**: Validates that sales are generating desired profits.

**Independent Test**: Can be tested by viewing order profitability.

**Acceptance Scenarios**:

1. **Given** order #123: revenue €10,000, material cost €5,000, labor €2,000, overheads €1,000, **When** calculating margin, **Then** gross margin = €2,000 (20%), net margin = €2,000 (20%)
2. **Given** viewing order list, **When** sorting by margin, **Then** orders with lowest margins are easily identifiable
3. **Given** comparing estimated vs actual margin, **When** order is completed, **Then** variance is shown

---

### User Story 3 - Customer Profitability Analysis (Priority: P1)

As a sales director, I want to analyze profitability by customer, so that I can identify our most valuable customers and address unprofitable relationships.

**Why this priority**: Customer-level profitability is critical for business decisions.

**Independent Test**: Can be tested by generating customer profitability reports.

**Acceptance Scenarios**:

1. **Given** customer A has 10 orders totaling €100,000 revenue, costs €70,000, **When** calculating customer margin, **Then** margin = €30,000 (30%)
2. **Given** customer profitability report, **When** viewing, **Then** shows: total revenue, total cost, margin, order count, average order value
3. **Given** identifying unprofitable customers, **When** filtering by margin < 10%, **Then** customers are flagged

---

### User Story 4 - Commercial Performance Tracking (Priority: P2)

As a sales manager, I want to track sales performance by commercial, so that I can evaluate team effectiveness and set targets.

**Why this priority**: Sales management requires individual performance visibility.

**Independent Test**: Can be tested by generating commercial performance reports.

**Acceptance Scenarios**:

1. **Given** commercial Jean has closed €500,000 this quarter, target €400,000, **When** viewing performance, **Then** shows 125% achievement
2. **Given** commercial has 20 quotes sent, 8 converted to orders, **When** calculating conversion rate, **Then** rate = 40%
3. **Given** viewing leaderboard, **When** sorting by revenue, **Then** commercials are ranked

---

### User Story 5 - DSO (Days Sales Outstanding) Tracking (Priority: P1)

As a finance director, I want to track the average number of days to collect payment from customers, so that I can manage cash flow and identify collection issues.

**Why this priority**: Cash flow is critical - DSO directly impacts working capital.

**Independent Test**: Can be tested by calculating DSO and verifying formula.

**Acceptance Scenarios**:

1. **Given** accounts receivable €50,000, annual revenue €365,000, **When** calculating DSO, **Then** DSO = (50,000 / 365,000) × 365 = 50 days
2. **Given** DSO target is 30 days, **When** current DSO is 50, **Then** variance is highlighted
3. **Given** viewing DSO trend, **When** comparing months, **Then** improvement or deterioration is visible

---

### User Story 6 - Financial Dashboard Overview (Priority: P1)

As a CEO, I want to see key financial metrics on a single dashboard, so that I can quickly assess business health.

**Why this priority**: Executives need at-a-glance financial visibility.

**Independent Test**: Can be tested by viewing financial dashboard.

**Acceptance Scenarios**:

1. **Given** viewing financial dashboard, **When** seeing KPIs, **Then** shows: Revenue (MTD/YTD), Gross Margin %, Net Margin %, DSO, Outstanding Receivables
2. **Given** revenue shows red indicator, **When** clicking, **Then** drill-down shows revenue breakdown by product/customer
3. **Given** month-end close, **When** generating report, **Then** P&L is automatically generated

---

### User Story 7 - ROI Analysis for Equipment (Priority: P2)

As a CFO, I want to calculate return on investment for equipment purchases, so that I can justify capital expenditures.

**Why this priority**: Capital investment decisions require ROI analysis.

**Independent Test**: Can be tested by calculating equipment ROI.

**Acceptance Scenarios**:

1. **Given** machine purchased for €100,000, generates €30,000 additional profit/year, **When** calculating ROI, **Then** ROI = 30% per year
2. **Given** payback period calculation, **When** using cash flow data, **Then** payback = 3.33 years
3. **Given** comparing investment options, **When** running scenario analysis, **Then** ROI comparisons are displayed

---

### User Story 8 - Trend Analysis and Forecasting (Priority: P2)

As a finance manager, I want to see financial trends over time, so that I can identify patterns and make forecasts.

**Why this priority**: Trend analysis supports better planning and decision-making.

**Independent Test**: Can be tested by generating trend reports.

**Acceptance Scenarios**:

1. **Given** revenue history: Jan €100k, Feb €110k, Mar €105k, **When** viewing trend, **Then** chart shows upward trend with average growth
2. **Given** viewing forecast, **When** using linear regression, **Then** next month predicted revenue is shown
3. **Given** comparing actual vs budget, **When** viewing variance, **Then** favorable/unfavorable variances are color-coded

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate product cost = material cost + labor cost + overhead allocation
- **FR-002**: System MUST support configurable labor rates and overhead allocation methods
- **FR-003**: System MUST calculate order margin = revenue − (material + labor + overhead)
- **FR-004**: System MUST calculate gross margin % and net margin % per order
- **FR-005**: System MUST aggregate customer profitability: sum of all orders, costs, margins
- **FR-006**: System MUST calculate commercial performance: revenue, order count, conversion rate, margin contribution
- **FR-007**: System MUST calculate DSO = (Accounts Receivable / Annual Revenue) × 365
- **FR-008**: System MUST track accounts receivable aging: 0-30, 31-60, 61-90, 90+ days
- **FR-009**: System MUST calculate ROI = (Annual Benefit / Investment Cost) × 100
- **FR-010**: System MUST calculate payback period = Investment / Annual Cash Flow
- **FR-011**: System MUST support budget vs actual variance analysis
- **FR-012**: System MUST generate P&L (Profit & Loss) report by period
- **FR-013**: System MUST support multi-currency (EUR primary, with conversion)
- **FR-014**: System MUST integrate with invoices for accurate revenue recognition

### Non-Functional Requirements

- **NFR-001**: Financial dashboard MUST load within 3 seconds
- **NFR-001**: Cost calculations MUST be accurate to within 0.1% of accounting records
- **NFR-002**: System MUST support 50 concurrent users
- **NFR-003**: All financial reports MUST be exportable to PDF and Excel

---

## Key Entities *(include if feature involves data)*

- **CostComponent**: id, name, type (material/labor/overhead), rate, unit, is_active
- **ProductCost**: id, profile_id, material_cost, labor_cost, overhead_cost, total_cost, calculated_at
- **OrderCosting**: id, order_id, material_cost, labor_cost, overhead_cost, total_cost, revenue, margin, margin_percent
- **CustomerProfitability**: id, customer_id, total_revenue, total_cost, total_margin, margin_percent, order_count, calculated_at
- **CommercialPerformance**: id, commercial_id, period_start, period_end, revenue, order_count, margin, conversion_rate
- **FinancialKPI**: id, kpi_type, value, period, calculated_at
- **EquipmentROI**: id, equipment_id, investment_cost, annual_benefit, roi_percent, payback_years, calculated_at

---

## Dependencies

- Requires: 001-auth-security (for user authentication and roles)
- Requires: 002-module-aluminium (for orders and products)
- Requires: 005-module-qualite (for quality costs)
- Required by: 008-bi-dashboard (for financial KPIs)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Product costs are calculated automatically from cost components
- **SC-002**: Order margin is available within 1 hour of order completion
- **SC-003**: DSO is calculated and updated daily
- **SC-004**: Financial dashboard loads within 3 seconds
- **SC-005**: All financial reports are accurate to within 0.1% of accounting records
