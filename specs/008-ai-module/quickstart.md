# Quick Start: AI Predictive Module

**Module:** 008-ai-module  
**Date:** 2026-03-07  
**Purpose:** Get developers up and running quickly with the AI module

---

## 1. Prerequisites

### 1.1 System Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20 LTS | Backend API |
| Python | 3.11+ | ML runtime |
| PostgreSQL | 14+ | With TimescaleDB extension |
| Redis | 7.x | Caching and job queue |
| Docker | 24+ | For ML service container |

### 1.2 Required Services

Ensure these services are running:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Node.js backend (port 3000)

---

## 2. Local Development Setup

### 2.1 Clone and Install Backend

```bash
# Navigate to backend
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies (in a virtual environment)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

pip install -r requirements-ai.txt
```

### 2.2 Environment Configuration

Create `.env` entries for AI module:

```bash
# AI/ML Configuration
AI_PYTHON_PATH=./python-ai
MLFLOW_TRACKING_URI=http://localhost:5001
REDIS_URL=redis://localhost:6379/1

# Model settings
FORECAST_MODEL_TYPE=prophet
FORECAST_RETRAIN_DAYS=7
STOCKOUT_PREDICTION_HOURS=1

# Optional: GPU support
CUDA_VISIBLE_DEVICES=0
```

### 2.3 Database Setup

Run the AI module migration:

```bash
# Run migration for AI tables
npm run migration:run -- --name=007-AIModule
```

Or manually execute `migrations/007-AIModule.ts` SQL.

### 2.4 Start Services

```bash
# Terminal 1: Start Node.js backend
npm run dev

# Terminal 2: Start MLflow (model registry)
docker run -d -p 5001:5000 \
  -v mlflow:/mlflow \
  --name mlflow \
  mlflow/mlflow:latest

# Terminal 3: Start Python AI service (optional - can run inline)
cd python-ai
python main.py
```

---

## 3. Verify Installation

### 3.1 Health Check

```bash
# Check AI module health
curl http://localhost:3000/api/ai/health

# Expected response:
{
  "status": "healthy",
  "pythonConnected": true,
  "modelsLoaded": true,
  "databaseConnected": true
}
```

### 3.2 Run Test Forecast

```bash
# Generate a test forecast
curl -X POST http://localhost:3000/api/ai/forecast/generate \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test-product-id",
    "horizon": 12
  }'

# Expected response:
{
  "success": true,
  "forecast": [
    {
      "targetDate": "2026-03-14",
      "predictedQuantity": 150.5,
      "confidence95": { "lower": 120, "upper": 181 }
    }
  ]
}
```

---

## 4. First-Time Configuration

### 4.1 Configure AI Models

```bash
# Initialize default models
curl -X POST http://localhost:3000/api/ai/models/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "models": [
      {
        "name": "demand_forecast",
        "type": "FORECASTING",
        "algorithm": "prophet",
        "hyperparameters": {
          "yearly_seasonality": true,
          "weekly_seasonality": true
        }
      },
      {
        "name": "stockout_predictor",
        "type": "STOCKOUT",
        "algorithm": "moving_average"
      },
      {
        "name": "inventory_optimizer",
        "type": "INVENTORY_OPT",
        "algorithm": "eoq"
      }
    ]
  }'
```

### 4.2 Configure Data Sources

```bash
# Link AI module to existing data sources
curl -X POST http://localhost:3000/api/ai/datasources/configure \
  -H "Content-Type: application/json" \
  -d '{
    "salesDataSource": {
      "module": "aluminium",
      "table": "customer_order",
      "dateField": "createdAt",
      "quantityField": "totalQuantity"
    },
    "inventoryDataSource": {
      "module": "stock",
      "table": "inventory_item",
      "quantityField": "quantity"
    }
  }'
```

---

## 5. Common Tasks

### 5.1 Generate Demand Forecast

```typescript
// Frontend example
import { aiApi } from '@/services/aiApi';

async function generateForecast(productId: string, horizon: number = 12) {
  const response = await aiApi.post('/forecast/generate', {
    productId,
    horizon,
    includeConfidence: true
  });
  return response.data;
}
```

### 5.2 Get Stockout Risk List

```typescript
async function getStockoutRisks() {
  const response = await aiApi.get('/stockout/risk-list', {
    params: {
      minRiskLevel: 'MEDIUM',
      includeAcknowledged: false
    }
  });
  return response.data;
}
```

### 5.3 Optimize Inventory

```typescript
async function optimizeInventory(itemId: string) {
  const response = await aiApi.get(`/inventory/optimize/${itemId}`);
  return response.data;
}
```

### 5.4 Optimize Production Schedule

```typescript
async function optimizeSchedule(startDate: string, endDate: string) {
  const response = await aiApi.post('/planning/optimize', {
    startDate,
    endDate,
    objectives: ['minimize_makespan', 'balance_load'],
    constraints: {
      maxLateDays: 3,
      avoidWeekends: true
    }
  });
  return response.data;
}
```

---

## 6. Docker Quick Start

### 6.1 Using Docker Compose

```bash
# Start all AI services
cd backend
docker-compose -f docker-compose.ai.yml up -d

# Check logs
docker-compose -f docker-compose.ai.yml logs -f python-ai
```

### 6.2 docker-compose.ai.yml Template

```yaml
version: '3.8'

services:
  python-ai:
    build:
      context: ./python-ai
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/erp
      - REDIS_URL=redis://redis:6379/1
      - MLFLOW_TRACKING_URI=http://mlflow:5001
    depends_on:
      - postgres
      - redis
      - mlflow
    volumes:
      - ./python-ai:/app

  mlflow:
    image: mlflow/mlflow:latest
    ports:
      - "5001:5001"
    volumes:
      - mlflow-data:/mlflow

volumes:
  mlflow-data:
```

---

## 7. Troubleshooting

### 7.1 Common Issues

| Issue | Solution |
|-------|----------|
| Python service won't start | Check Python version (3.11+) and dependencies |
| Model training fails | Verify PostgreSQL has TimescaleDB extension |
| Redis connection error | Check Redis is running on port 6379 |
| Out of memory during training | Reduce batch size or use smaller dataset |

### 7.2 Logs Location

```bash
# Node.js logs
tail -f backend/logs/ai-service.log

# Python AI logs
docker logs python-ai

# MLflow logs
docker logs mlflow
```

### 7.3 Reset AI Module

```bash
# Clear all predictions and retrain
curl -X POST http://localhost:3000/api/ai/admin/reset \
  -H "Content-Type: application/json" \
  -d '{"clearModels": true, "clearPredictions": true}'
```

---

## 8. Next Steps

After setup, proceed to:
1. **[plan.md](./plan.md)** - View implementation timeline
2. **[tasks.md](./tasks.md)** - See detailed task breakdown
3. **[contracts/ai-api.yaml](./contracts/ai-api.yaml)** - Review API contracts

---

*Document Version: 1.0*  
*Created: 2026-03-07*
