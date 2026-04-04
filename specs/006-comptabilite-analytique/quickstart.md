# Quickstart: Comptabilité Analytique (Analytical Accounting) Module

**Feature**: 006-comptabilite-analytique  
**Date**: 2025-03-03

---

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+
- Redis 7+ (for KPI caching)
- Completed modules: 001-auth-security, 002-module-aluminium

---

## Environment Setup

### 1. Clone and Install

```bash
# From project root
git checkout 006-comptabilite-analytique

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_aluminium
DB_USER=postgres
DB_PASSWORD=your_password

# Redis (for KPI caching)
REDIS_URL=redis://localhost:6379

# Analytical Accounting
OVERHEAD_ALLOCATION_METHOD=labor_hours
DEFAULT_LABOR_RATE=25.00
DEFAULT_OVERHEAD_RATE=0.50
DSO_TARGET_DAYS=30
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Database Migrations

```bash
cd backend
npm run migration:run
```

This creates the following tables:
- cost_component
- product_cost
- order_costing
- customer_profitability
- commercial_performance
- financial_kpi
- equipment_roi
- receivable_aging

### 4. Seed Initial Data

```bash
cd backend
npm run seed:comptabilite
```

This creates sample:
- Cost components (material, labor, overhead)
- Default overhead configuration

---

## Quick Start Guide

### Step 1: Configure Cost Components

Navigate to: **Finance → Cost Configuration**

1. Add material costs (linked to inventory items)
2. Configure labor rates by operation type
3. Set overhead allocation method and rate

### Step 2: Calculate Product Costs

The system automatically calculates product costs based on:
- Material costs from inventory
- Labor hours from routing
- Overhead allocation

To recalculate:
```bash
# Manual recalculation
POST /api/comptabilite/costs/recalculate
```

### Step 3: View Financial Dashboard

Navigate to: **Dashboard → Financial Overview**

This shows:
- Revenue (MTD/YTD)
- Gross Margin %
- Net Margin %
- DSO
- Outstanding Receivables

---

## API Endpoints

### Cost Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/comptabilite/cost-components | List all cost components |
| POST | /api/comptabilite/cost-components | Create cost component |
| PUT | /api/comptabilite/cost-components/:id | Update cost component |
| GET | /api/comptabilite/product-costs | Get product cost calculations |
| POST | /api/comptabilite/costs/recalculate | Trigger cost recalculation |

### Profitability Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/comptabilite/orders/:id/costing | Get order costing details |
| GET | /api/comptabilite/customers/:id/profitability | Get customer profitability |
| GET | /api/comptabilite/commercials/:id/performance | Get commercial performance |

### Financial KPIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/comptabilite/kpis/dashboard | Get dashboard KPIs |
| GET | /api/comptabilite/kpis/dso | Get DSO metrics |
| GET | /api/comptabilite/kpis/aging | Get receivable aging |
| GET | /api/comptabilite/roi/:equipmentId | Get equipment ROI |

---

## Testing

### Run Unit Tests

```bash
cd backend
npm test -- --testPathPattern=comptabilite
```

### Run Integration Tests

```bash
cd backend
npm run test:integration
```

---

## Common Issues

### Q: Product costs show as €0
**A**: Ensure cost components are created and linked to products

### Q: DSO shows as Infinity
**A**: This happens when annual revenue is €0. Complete some orders first

### Q: Margins are negative
**A**: Check that all costs are properly configured; negative margin means costs > revenue

---

## Next Steps

1. Review [spec.md](./spec.md) for full requirements
2. Review [data-model.md](./data-model.md) for entity definitions
3. Review [plan.md](./plan.md) for implementation phases
4. Check [tasks.md](./tasks.md) for detailed work items
