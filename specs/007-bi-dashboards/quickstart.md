# BI Dashboards Quick Start Guide

## Prerequisites

- Node.js 20 LTS
- PostgreSQL database
- Redis (optional, for caching)
- Backend server running on port 3000
- Frontend running on port 5173

## Installation

### 1. Backend Setup

The BI Dashboards module is already integrated into the backend. No additional installation needed.

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup

The frontend dependencies are already installed. Run:

```bash
cd frontend
npm run dev
```

## Accessing BI Dashboards

1. Login to the ERP system
2. Click on "BI Dashboards" in the sidebar navigation
3. Select a dashboard type from the dropdown:
   - **Executive Dashboard** - High-level KPIs for executives
   - **Operations Dashboard** - Operational metrics
   - **Finance Dashboard** - Financial indicators
   - **Technical Dashboard** - Maintenance & quality metrics

## Using the Dashboard

### Date Range Selection

Use the date range buttons to filter data:
- **Aujourd'hui** (Today)
- **Semaine** (This Week)
- **Mois** (This Month)
- **Trimestre** (This Quarter)
- **Année** (This Year)

The widgets will automatically update to show data within the selected period.

### Dashboard Navigation

1. **Select Dashboard**: Use the dropdown to switch between dashboards
2. **Refresh Data**: Click the refresh button to reload widget data
3. **Export**: Click export to download data (PDF/Excel)

### Widget Types

| Widget Type | Description |
|-------------|-------------|
| KPI Card | Single metric with trend indicator |
| Line Chart | Time series data visualization |
| Bar Chart | Comparative analysis |
| Pie Chart | Distribution visualization |
| Area Chart | Cumulative metrics |
| Gauge | Progress/performance indicators |
| Data Table | Sortable data grids |

## Available Metrics

### Revenue Analytics
- Total revenue
- Monthly revenue trends
- Revenue by customer

### Order Analytics
- Orders by status
- Order trends over time
- Conversion rates

### Stock Analytics
- Total stock value
- Stock by category
- Low stock alerts

### Maintenance Analytics
- Work orders by status
- Maintenance costs
- Machine TRS/OEE

### Quality Analytics
- Inspection pass rate
- NCR trends
- Quality metrics

### Comptabilité Analytics
- Profitability by order
- Cost breakdown
- Average margin

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/bi/dashboards` | List all dashboards |
| GET | `/api/v1/bi/dashboards/:id` | Get dashboard details |
| GET | `/api/v1/bi/dashboards/:id/data` | Get dashboard with widget data |
| POST | `/api/v1/bi/dashboards` | Create new dashboard |
| PUT | `/api/v1/bi/dashboards/:id` | Update dashboard |
| DELETE | `/api/v1/bi/dashboards/:id` | Delete dashboard |
| POST | `/api/v1/bi/seed` | Seed default dashboards |

## Troubleshooting

### Dashboard not loading
- Check backend is running on port 3000
- Check console for API errors
- Verify database connection

### Widget showing no data
- Verify date range includes data
- Check that related module has data
- Review browser console for errors

### Performance issues
- Clear browser cache
- Reduce date range
- Check network connection

## Next Steps

- Customize dashboard layouts (Phase 2)
- Add custom widgets (Phase 2)
- Configure data exports (Phase 2)
- Set up scheduled reports (Future)
