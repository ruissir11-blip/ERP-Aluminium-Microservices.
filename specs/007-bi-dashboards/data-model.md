# BI Dashboards Data Model

## Database Tables

### bi_dashboards

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Dashboard name |
| description | VARCHAR(255) | NULLABLE | Dashboard description |
| type | ENUM | NOT NULL | Dashboard type (executive, operations, finance, technical, custom) |
| is_default | BOOLEAN | DEFAULT FALSE | Is default dashboard |
| is_public | BOOLEAN | DEFAULT TRUE | Visible to all users |
| created_by | UUID | NULLABLE | Creator user ID |
| updated_by | UUID | NULLABLE | Last updater user ID |
| layout | JSONB | NULLABLE | Custom widget layout positions |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | DEFAULT NOW | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW | Last update timestamp |

### bi_widgets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| dashboard_id | UUID | FK → bi_dashboards.id | Parent dashboard |
| title | VARCHAR(100) | NOT NULL | Widget title |
| description | VARCHAR(255) | NULLABLE | Widget description |
| widget_type | ENUM | NOT NULL | Widget type |
| data_source | ENUM | NOT NULL | Data source module |
| config | JSONB | NULLABLE | Widget configuration (metrics, filters, colors) |
| width | INTEGER | DEFAULT 3 | Widget width (1-12) |
| height | INTEGER | DEFAULT 2 | Widget height (1-6) |
| position_x | INTEGER | DEFAULT 0 | X position in grid |
| position_y | INTEGER | DEFAULT 0 | Y position in grid |
| is_active | BOOLEAN | DEFAULT TRUE | Widget visibility |
| is_locked | BOOLEAN | DEFAULT FALSE | Lock position |
| created_at | TIMESTAMP | DEFAULT NOW | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW | Last update timestamp |

## Enums

### DashboardType

```typescript
enum DashboardType {
  EXECUTIVE = 'executive',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
  TECHNICAL = 'technical',
  CUSTOM = 'custom'
}
```

### WidgetType

```typescript
enum WidgetType {
  KPI_CARD = 'kpi_card',
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  DATA_TABLE = 'data_table',
  GAUGE = 'gauge',
  HEAT_MAP = 'heat_map'
}
```

### WidgetDataSource

```typescript
enum WidgetDataSource {
  REVENUE = 'revenue',
  ORDERS = 'orders',
  STOCK = 'stock',
  MAINTENANCE = 'maintenance',
  QUALITY = 'quality',
  COMPTABILITE = 'comptabilite',
  CUSTOM = 'custom'
}
```

## API Data Structures

### DashboardData Response

```typescript
interface DashboardData {
  dashboard: BiDashboard;
  widgets: WidgetData[];
}

interface WidgetData {
  widgetId: string;
  title: string;
  type: WidgetType;
  data: unknown;
  config: Record<string, unknown> | null;
}
```

### Date Range Filter

```typescript
interface DateRange {
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
}
```

## Widget Configuration Schema

### KPI Card Config

```typescript
interface KPIConfig {
  metric: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  showTrend: boolean;
  decimalPlaces: number;
  prefix?: string;
  suffix?: string;
}
```

### Chart Config

```typescript
interface ChartConfig {
  metric: string;
  groupBy?: string;
  colors?: string[];
  showLegend: boolean;
  showGrid: boolean;
  animationDuration: number;
}
```

### Data Table Config

```typescript
interface DataTableConfig {
  columns: Array<{
    key: string;
    label: string;
    sortable: boolean;
    format?: 'currency' | 'percentage' | 'date' | 'number';
  }>;
  pageSize: number;
  showPagination: boolean;
}
```

## Indexes

```sql
-- Dashboard queries
CREATE INDEX idx_bi_dashboards_type ON bi_dashboards(type);
CREATE INDEX idx_bi_dashboards_is_default ON bi_dashboards(is_default);
CREATE INDEX idx_bi_dashboards_is_active ON bi_dashboards(is_active);

-- Widget queries
CREATE INDEX idx_bi_widgets_dashboard ON bi_widgets(dashboard_id);
CREATE INDEX idx_bi_widgets_type ON bi_widgets(widget_type);
CREATE INDEX idx_bi_widgets_data_source ON bi_widgets(data_source);
```

## Relationships

```
bi_dashboards (1) ─────< (N) bi_widgets
     │
     └─ created_by > User
     └─ updated_by > User
```
