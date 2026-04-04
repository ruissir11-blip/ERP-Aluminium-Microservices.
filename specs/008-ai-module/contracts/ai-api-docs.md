# AI Module API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
Currently no authentication required for AI service endpoints.

---

## Endpoints

### 1. Forecast Generation

#### POST /forecast/generate
Generate demand forecast for a product using Prophet, SARIMA, or auto-selection.

**Request Body:**
```json
{
  "product_id": "string (required)",
  "horizon": 12,
  "model_type": "auto|prophet|sarima|lstm",
  "confidence_level": 0.95
}
```

**Response:**
```json
{
  "product_id": "PROD-001",
  "forecasts": [
    {
      "date": "2026-04-01T00:00:00",
      "predicted_value": 12500,
      "lower_bound": 11000,
      "upper_bound": 14000
    }
  ],
  "model_used": "prophet",
  "accuracy": 0.85,
  "generated_at": "2026-03-08T12:00:00"
}
```

---

### 2. Forecast History

#### GET /forecast/history/{product_id}
Get historical forecasts for a product.

**Parameters:**
- `product_id` (path) - Product identifier
- `limit` (query) - Number of records to return (default: 10)

**Response:**
```json
{
  "product_id": "PROD-001",
  "forecasts": [
    {
      "product_id": "PROD-001",
      "forecast_date": "2026-03-01",
      "predicted_value": 12000,
      "lower_bound": 10000,
      "upper_bound": 14000,
      "is_manual_override": false,
      "created_at": "2026-03-01T00:00:00"
    }
  ]
}
```

---

### 3. Forecast Override

#### POST /forecast/override
Override automated forecast with manual value.

**Query Parameters:**
- `product_id` - Product identifier
- `forecast_date` - Date to override (ISO format)
- `manual_value` - Manual forecast value

**Response:**
```json
{
  "status": "success",
  "message": "Forecast override applied"
}
```

---

### 4. Stockout Prediction

#### POST /stockout/predict
Predict stockout risk for an inventory item.

**Request Body:**
```json
{
  "inventory_item_id": "string (required)",
  "days_horizon": 30
}
```

**Response:**
```json
{
  "inventory_item_id": "ITEM-001",
  "predictions": [
    {
      "date": "2026-03-15",
      "predicted_stock": 50,
      "stockout_probability": 0.3
    }
  ],
  "risk_summary": {
    "current_stock": 500,
    "consumption_rate": 15.5,
    "days_until_stockout": 32,
    "probability": 0.25,
    "risk_level": "low",
    "lead_time_days": 7,
    "recommended_order_quantity": 350,
    "reorder_point": 109
  },
  "generated_at": "2026-03-08T12:00:00"
}
```

---

### 5. Stockout Acknowledge

#### POST /stockout/acknowledge
Acknowledge a stockout prediction.

**Query Parameters:**
- `prediction_id` - Prediction ID to acknowledge
- `acknowledged_by` - User acknowledging

**Response:**
```json
{
  "status": "success",
  "message": "Stockout prediction acknowledged"
}
```

---

### 6. Inventory Optimization

#### POST /inventory/optimize
Optimize inventory using EOQ (Economic Order Quantity).

**Request Body:**
```json
{
  "inventory_item_id": "string (required)",
  "annual_demand": 10000,
  "unit_cost": 50,
  "ordering_cost": 100,
  "holding_cost_rate": 0.25,
  "quantity_discounts": [
    { "min_quantity": 500, "discount": 5 },
    { "min_quantity": 1000, "discount": 10 }
  ]
}
```

**Response:**
```json
{
  "inventory_item_id": "ITEM-001",
  "eoq": 283,
  "safety_stock": 35,
  "reorder_point": 144,
  "optimal_order_quantity": 500,
  "quantity_discount_applied": 5,
  "total_annual_cost": 510000,
  "savings_vs_current": 15000,
  "recommendations": [
    "Order 500 units when stock reaches 144",
    "Maintain safety stock of 35 units"
  ],
  "generated_at": "2026-03-08T12:00:00"
}
```

---

### 7. Production Schedule

#### POST /production/schedule
Generate production schedule using genetic algorithm or priority rules.

**Request Body:**
```json
{
  "orders": [
    {
      "id": "ORD-001",
      "product_id": "PROD-A",
      "quantity": 100,
      "priority": 1,
      "due_date": "2026-03-15"
    }
  ],
  "machines": [
    {
      "id": "MACH-001",
      "name": "Press A",
      "throughput": 100
    }
  ],
  "algorithm": "genetic|priority_rules"
}
```

**Response:**
```json
{
  "schedules": [
    {
      "order_id": "ORD-001",
      "product_id": "PROD-A",
      "machine_id": "MACH-001",
      "scheduled_start": "2026-03-08T09:00:00",
      "scheduled_end": "2026-03-08T17:00:00",
      "priority_score": 1,
      "status": "scheduled"
    }
  ],
  "total_conflicts": 0,
  "utilization": {
    "MACH-001": 75.5,
    "MACH-002": 60.0
  },
  "algorithm_used": "genetic_algorithm",
  "generated_at": "2026-03-08T12:00:00"
}
```

---

### 8. Data Extraction

#### POST /data/extract
Extract data from ERP modules for AI processing.

**Request Body:**
```json
{
  "module": "aluminium|stock|maintenance",
  "entity": "orders|inventory|machines",
  "start_date": "2026-01-01",
  "end_date": "2026-03-01",
  "filters": {
    "product_id": "PROD-001"
  }
}
```

**Response:**
```json
{
  "module": "aluminium",
  "entity": "orders",
  "count": 100,
  "data": [...]
}
```

---

### 9. MLflow Models

#### GET /mlflow/models
List registered ML models in MLflow.

**Response:**
```json
{
  "models": [
    {
      "name": "prophet-demand-forecast",
      "latest_version": "1",
      "description": "Demand forecasting model"
    }
  ]
}
```

---

### 10. Health Check

#### GET /health
Check AI service health.

**Response:**
```json
{
  "status": "healthy",
  "service": "ai",
  "timestamp": "2026-03-08T12:00:00"
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

**Status Codes:**
- 200 - Success
- 400 - Bad Request
- 500 - Internal Server Error
- 503 - Service Unavailable

---

## Caching

The AI service implements Redis caching:

| Endpoint | Cache TTL |
|----------|-----------|
| /forecast/generate | 30 minutes |
| /stockout/predict | 1 hour |
| /inventory/optimize | 2 hours |
| /production/schedule | 30 minutes |

---

## Rate Limits

Currently no rate limits configured.

---

## Integration with Backend

The Node.js backend provides proxy endpoints at `/api/ai/*` that forward requests to the Python AI service.

Example:
```
GET /api/ai/forecast/generate -> http://localhost:5000/forecast/generate
```
