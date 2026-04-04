# 007 - BI Dashboards Specification

## 1. Project Overview

**Project Name:** ERP Aluminium - BI Dashboards Module  
**Project Type:** Business Intelligence & Analytics Module  
**Core Functionality:** Advanced cross-module analytics dashboard providing unified business insights, customizable visualizations, and data-driven decision support across all ERP modules (Aluminium, Stock, Maintenance, Quality, Comptabilite).  
**Target Users:** Executives, Department Managers, Analysts, and Operations Teams

## 2. Technical Stack

- **Frontend:** React 18 + TypeScript 5.3, TailwindCSS, Recharts for visualizations
- **Backend:** Node.js 20 LTS + TypeScript 5.3, Express.js 4.x
- **Database:** TypeORM with PostgreSQL
- **Caching:** Redis 7.x for dashboard data caching
- **Charts:** Recharts (frontend), Chart.js (backend export)

## 3. UI/UX Specification

### 3.1 Layout Structure

**Main Dashboard Page:**
- Fixed sidebar navigation (280px width)
- Top header with user info and quick actions (64px height)
- Main content area with responsive grid
- Collapsible widget panels

**Dashboard Grid System:**
- 12-column grid layout
- Widget sizes: 3 (quarter), 4 (third), 6 (half), 12 (full)
- Drag-and-drop widget repositioning
- Minimum widget height: 200px

### 3.2 Visual Design

**Color Palette:**
- Primary: `#0d9488` (Teal 600)
- Secondary: `#1e3a5f` (Dark Blue)
- Accent: `#f59e0b` (Amber 500)
- Background: `#f8fafc` (Slate 50)
- Surface: `#ffffff` (White)
- Text Primary: `#1e293b` (Slate 800)
- Text Secondary: `#64748b` (Slate 500)
- Success: `#10b981` (Emerald 500)
- Warning: `#f59e0b` (Amber 500)
- Error: `#ef4444` (Red 500)
- Chart Colors: `['#0d9488', '#1e3a5f', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']`

**Typography:**
- Headings: Inter, 600 weight
  - H1: 28px
  - H2: 22px
  - H3: 18px
- Body: Inter, 400 weight, 14px
- Small/Labels: 12px
- Numbers/Metrics: Inter, 700 weight

**Spacing System:**
- Base unit: 4px
- Widget padding: 16px
- Grid gap: 16px
- Section margin: 24px

**Visual Effects:**
- Card shadows: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Hover elevation: `0 4px 6px rgba(0,0,0,0.1)`
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Transitions: 200ms ease-in-out

### 3.3 Components

**Widget Types:**
1. **KPI Card:** Single metric with trend indicator
2. **Line Chart:** Time-series data visualization
3. **Bar Chart:** Comparative analysis
4. **Pie/Donut Chart:** Distribution visualization
5. **Area Chart:** Cumulative metrics
6. **Data Table:** Sortable, filterable data grids
7. **Gauge:** Progress/performance indicators
8. **Heat Map:** Correlation matrices

**Component States:**
- Default: Standard appearance
- Hover: Elevated shadow, slight scale (1.01)
- Loading: Skeleton placeholders with pulse animation
- Error: Red border, error message
- Empty: Placeholder with call-to-action

**Interactive Elements:**
- Date range picker (presets + custom)
- Module filter dropdowns
- Export buttons (PDF, Excel, CSV)
- Full-screen widget mode
- Refresh data button
- Save dashboard layout

## 4. Functional Specification

### 4.1 Core Features

**Dashboard Management:**
- Pre-built dashboard templates (Executive, Operations, Finance, Technical)
- Custom dashboard creation with widget library
- Dashboard sharing and permissions
- Dashboard versioning and history

**Analytics Widgets:**

| Widget | Data Source | Metrics |
|--------|-------------|---------|
| Revenue Overview | Invoices, Orders | Monthly/Quarterly/Annual revenue, growth rate |
| Order Pipeline | Quotes, Orders | Conversion rate, avg cycle time |
| Stock Health | Inventory | Turnover rate, stock value, alerts |
| Machine OEE | Maintenance | TRS, availability, performance |
| Quality Score | Quality Records | Pass rate, defect density, NCR trends |
| Profitability | Comptabilite | Margins by product/customer |
| Cash Flow | Receivables | Aging, collection rate |
| Cost Analysis | Order Costing | Cost breakdown, variance |

**Cross-Module Analytics:**
- Order-to-Cash cycle analysis
- Stock-to-Production correlation
- Maintenance cost per unit
- Quality impact on returns
- Customer profitability across products

**Data Export:**
- PDF report generation with charts
- Excel export with data tables
- CSV raw data export
- Scheduled email reports

### 4.2 User Interactions

**Dashboard Navigation:**
1. Select dashboard from sidebar menu
2. Choose date range (Today, This Week, This Month, This Quarter, This Year, Custom)
3. Filter by relevant parameters (warehouse, machine, customer segment)
4. Click widget for drill-down view
5. Export or share dashboard

**Widget Interactions:**
- Hover: Show detailed tooltip
- Click: Open detailed view/modal
- Drag: Reposition widget (custom dashboards)
- Resize: Adjust widget size (custom dashboards)
- Refresh: Update widget data

### 4.3 Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway     │────▶│  Dashboard      │
│   (React)       │◀────│   (Express)       │◀────│  Service        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                              ┌───────────────────────────┼───────────────┐
                              │                           │               │
                        ┌─────▼─────┐            ┌───────▼───────┐ ┌─────▼─────┐
                        │  Redis    │            │  TypeORM      │ │ External  │
                        │  Cache    │            │  (PostgreSQL) │ │ APIs      │
                        └───────────┘            └───────────────┘ └───────────┘
```

### 4.4 Key Modules and Classes

**Backend:**

| Class | Responsibility | Public API |
|-------|---------------|------------|
| `DashboardService` | Aggregates data for widgets | `getDashboardData()`, `getWidgetData()` |
| `WidgetService` | Manages widget configurations | `getWidgets()`, `saveWidget()` |
| `AnalyticsService` | Computes complex metrics | `computeTrend()`, `computeComparison()` |
| `ExportService` | Generates reports | `exportPDF()`, `exportExcel()` |

**Frontend:**

| Component | Responsibility |
|-----------|---------------|
| `BIDashboard` | Main dashboard container |
| `WidgetGrid` | Manages widget layout |
| `KPIWidget` | Single metric display |
| `ChartWidget` | Chart visualizations |
| `DateRangePicker` | Date selection control |
| `ExportMenu` | Export options dropdown |

### 4.5 Edge Cases

- **No Data:** Display empty state with guidance
- **Loading Timeout:** Show error after 30s with retry option
- **Large Datasets:** Implement pagination (100 rows default)
- **Invalid Date Range:** Validate and show warning
- **Permission Denied:** Show restricted access message
- **Cache Expired:** Auto-refresh with notification

## 5. API Endpoints

### Dashboard Management
```
GET    /api/dashboards           - List available dashboards
GET    /api/dashboards/:id       - Get dashboard with widgets
POST   /api/dashboards           - Create custom dashboard
PUT    /api/dashboards/:id       - Update dashboard
DELETE /api/dashboards/:id      - Delete dashboard
```

### Widget Data
```
GET    /api/widgets/:id/data     - Get widget data
POST   /api/widgets/:id/refresh  - Force refresh widget
```

### Analytics
```
GET    /api/analytics/overview   - Cross-module summary
GET    /api/analytics/trends     - Historical trends
GET    /api/analytics/comparison - Comparative analysis
```

### Export
```
POST   /api/export/pdf          - Generate PDF report
POST   /api/export/excel        - Generate Excel report
```

## 6. Database Schema

**Tables:**
- `bi_dashboards` - Dashboard configurations
- `bi_widgets` - Widget definitions
- `bi_widget_data` - Cached widget data
- `bi_reports` - Scheduled report configs

## 7. Acceptance Criteria

### Visual Checkpoints
- [ ] Dashboard loads within 2 seconds (cached)
- [ ] All widgets display without layout shift
- [ ] Charts render correctly with sample data
- [ ] Date range picker updates all widgets
- [ ] Export produces valid PDF/Excel files
- [ ] Responsive layout works on tablet (768px+)

### Functional Checkpoints
- [ ] Pre-built dashboards show accurate data
- [ ] Cross-module analytics compute correctly
- [ ] Filters apply to all relevant widgets
- [ ] Cache invalidation works on data updates
- [ ] Error states display user-friendly messages

### Performance Targets
- Initial load: < 3 seconds
- Widget refresh: < 1 second
- Export generation: < 10 seconds
- Cache hit rate: > 90%
