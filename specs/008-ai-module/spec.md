# 008 - AI Module Specification

## 1. Project Overview

**Project Name:** ERP Aluminium - AI Predictive Module  
**Project Type:** Artificial Intelligence & Machine Learning Module  
**Core Functionality:** Transform the ERP from a reactive management tool into a proactive, AI-driven system capable of predicting demand, preventing stockouts, optimizing inventory levels, and assisting production planning.  
**Target Users:** Operations Managers, Supply Chain Planners, Production Supervisors, Executives

---

## 2. Executive Summary

The AI Module represents Phase 5 of the ERP Aluminium project, bringing intelligent prediction and optimization capabilities to the platform. This module leverages existing data from the Aluminium, Stock, Maintenance, and Quality modules to provide:

- **Demand Forecasting**: Predict future sales volumes with confidence intervals
- **Stockout Prevention**: Alert before stock depletion occurs
- **Inventory Optimization**: Calculate optimal reorder quantities using EOQ models
- **Production Planning Assistant**: Optimize production sequencing and resource allocation

---

## 3. Technical Stack

### 3.1 Core Technologies

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Backend API** | Node.js 20 LTS + Python 3.11 | Node.js for API endpoints, Python for ML workloads |
| **ML Framework** | Python 3.11 + scikit-learn, Prophet, TensorFlow | Industry standard for ML/IA |
| **Database** | PostgreSQL + TimescaleDB extension | Time-series optimized for forecasting |
| **Cache** | Redis 7.x | Real-time prediction caching |
| **Task Queue** | BullMQ + Redis | Async ML job processing |
| **Model Registry** | MLflow | Model versioning and tracking |

### 3.2 Architecture Pattern

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React FE      │────▶│  Node.js API    │────▶│  Python ML      │
│   (Dashboard)   │     │  (Fast Gateway) │     │  (Prediction)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   PostgreSQL    │     │   MLflow        │
                        │   + TimescaleDB │     │   (Models)      │
                        └─────────────────┘     └─────────────────┘
```

### 3.3 Data Integration

The AI module consumes data from existing modules:

| Source Module | Data Used | AI Feature |
|---------------|-----------|------------|
| **Aluminium** | Sales history, Quotes, Orders, Customer data | Demand Forecasting |
| **Stock** | Inventory levels, Stock movements, Lead times | Stockout Prediction, Inventory Optimization |
| **Maintenance** | Machine status, Maintenance history, Downtime | Production Planning |
| **Quality** | Defect rates, Inspection results | Production Planning |

---

## 4. Feature Specifications

### 4.1 Demand Forecasting (Prévision de la Demande)

#### 4.1.1 Overview

Predict future sales volumes by product category, aluminium profile type, and time period using time-series analysis.

#### 4.1.2 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DF-01 | Generate 12-month sales forecast by product reference | Must |
| DF-02 | Support short-term (1-4 weeks) and medium-term (1-3 months) forecasts | Must |
| DF-03 | Provide confidence intervals (80%, 95%) for predictions | Should |
| DF-04 | Incorporate seasonality detection and handling | Should |
| DF-05 | Consider quote-to-order conversion rates in predictions | Could |
| DF-06 | Allow manual override of AI predictions | Should |

#### 4.1.3 Algorithm Selection

| Dataset Size | Recommended Algorithm | Rationale |
|-------------|----------------------|-----------|
| < 1,000 data points | SARIMA / Exponential Smoothing | Simple, interpretable |
| 1,000 - 10,000 data points | Facebook Prophet | Handles seasonality well |
| > 10,000 data points | LSTM Neural Network | Captures complex patterns |

#### 4.1.4 Data Inputs

- Historical sales data (24+ months recommended)
- Seasonal indicators (month, quarter, holiday periods)
- Product lifecycle stage
- Customer segment data
- Quote pipeline conversion rates

#### 4.1.5 Outputs

- Predicted quantities by product reference
- Confidence intervals (lower bound, upper bound)
- Trend indicators (increasing, stable, decreasing)
- Accuracy metrics (MAPE, RMSE)

#### 4.1.6 API Endpoints

```
POST /api/ai/forecast/generate
GET  /api/ai/forecast/history
GET  /api/ai/forecast/:productId
POST /api/ai/forecast/override
GET  /api/ai/forecast/accuracy
```

---

### 4.2 Stockout Prediction (Anticipation des Ruptures de Stock)

#### 4.2.1 Overview

Alert users before stock depletion occurs by analyzing current inventory, incoming shipments, and predicted consumption.

#### 4.2.2 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SP-01 | Calculate days-to-stockout for all inventory items | Must |
| SP-02 | Generate alerts at configurable horizons (J+7, J+14, J+30) | Must |
| SP-03 | Prioritize alerts by product criticality | Should |
| SP-04 | Integrate with existing StockAlert system | Should |
| SP-05 | Suggest reorder quantities based on forecast | Should |
| SP-06 | Consider pending purchase orders in calculations | Must |

#### 4.2.3 Calculation Logic

```
Days to Stockout = (Current Stock + Pending Incoming) / Average Daily Consumption

Risk Levels:
- CRITICAL: Days to Stockout ≤ 7
- HIGH:     Days to Stockout ≤ 14
- MEDIUM:   Days to Stockout ≤ 30
- LOW:      Days to Stockout > 30
```

#### 4.2.4 Data Inputs

- Current inventory levels (InventoryItem)
- Pending stock movements (StockMovement with status PENDING)
- Historical consumption rates (calculated from StockMovement)
- Purchase order lead times
- Safety stock levels

#### 4.2.5 Outputs

- List of items at risk of stockout
- Days-to-stockout for each item
- Risk level classification
- Recommended reorder date and quantity
- Suggested supplier (based on historical data)

#### 4.2.6 API Endpoints

```
GET  /api/ai/stockout/risk-list
GET  /api/ai/stockout/item/:id
POST /api/ai/stockout/refresh
GET  /api/ai/stockout/alerts
```

---

### 4.3 Inventory Optimization (Optimisation des Niveaux d'Approvisionnement)

#### 4.3.1 Overview

Calculate optimal reorder quantities using the Economic Order Quantity (EOQ) model adapted with business constraints.

#### 4.3.2 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| IO-01 | Calculate EOQ for each stocked item | Must |
| IO-02 | Consider minimum order quantities from suppliers | Must |
| IO-03 | Factor in quantity discounts from suppliers | Could |
| IO-04 | Calculate reorder points based on lead time | Must |
| IO-05 | Determine optimal safety stock levels | Should |
| IO-06 | Generate purchase recommendations with dates | Must |

#### 4.3.3 Algorithm: Enhanced Wilson Model

```
EOQ = √(2 × D × S / H)

Where:
- D = Annual demand (from forecast)
- S = Ordering cost (fixed cost per order)
- H = Holding cost (percentage of unit cost)

Reorder Point (ROP) = (Lead Time × Daily Demand) + Safety Stock

Safety Stock = Z × σ × √Lead Time
Where Z = service factor (1.65 for 95% service level)
```

#### 4.3.4 Data Inputs

- Annual demand forecast
- Ordering cost (configurable per item)
- Holding cost rate (percentage)
- Supplier lead times
- Minimum order quantities
- Quantity discount schedules
- Current unit cost

#### 4.3.5 Outputs

- Recommended reorder quantity (EOQ)
- Reorder point (ROP)
- Optimal safety stock level
- Expected annual cost savings
- Order schedule for next 12 weeks

#### 4.3.6 API Endpoints

```
GET  /api/ai/inventory/optimize/:itemId
POST /api/ai/inventory/optimize-all
GET  /api/ai/inventory/recommendations
GET  /api/ai/inventory/savings
```

---

### 4.4 Production Planning Assistant (Aide à la Planification Production)

#### 4.4.1 Overview

Optimize production order sequencing and detect resource conflicts to improve shop floor efficiency.

#### 4.4.2 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PP-01 | Sequence production orders to minimize setup time | Should |
| PP-02 | Detect resource conflicts (machines, materials, labor) | Must |
| PP-03 | Suggest order grouping for aluminium cutting optimization | Could |
| PP-04 | Forecast production capacity utilization | Should |
| PP-05 | Identify bottleneck resources | Should |
| PP-06 | Integrate with maintenance schedule for capacity planning | Could |

#### 4.4.3 Algorithm: Genetic Algorithm for Scheduling

```
Objective Function: Minimize Total Makespan

Constraints:
- Machine availability
- Material availability
- Labor skill matching
- Delivery deadlines
- Setup time minimization
```

#### 4.4.4 Data Inputs

- Production orders (from Aluminium module)
- Machine capabilities and availability
- Material requirements (from Bill of Materials)
- Labor skills and availability
- Maintenance schedule
- Historical production times

#### 4.4.5 Outputs

- Optimized production schedule
- List of resource conflicts with resolution suggestions
- Production capacity heatmap (next 4 weeks)
- Bottleneck analysis report
- Suggested order groupings

#### 4.4.6 API Endpoints

```
POST /api/ai/planning/optimize
GET  /api/ai/planning/conflicts
GET  /api/ai/planning/capacity
GET  /api/ai/planning/bottlenecks
POST /api/ai/planning/group
```

---

## 5. UI/UX Specification

### 5.1 Layout Structure

**AI Dashboard Page:**
- Fixed sidebar navigation (280px width)
- Top header with AI module title and quick actions (64px height)
- Main content area with tabbed interface
- Each AI feature in its own tab

**Tab Structure:**
1. Demand Forecasting
2. Stockout Alerts
3. Inventory Optimization
4. Production Planning

### 5.2 Visual Design

**Color Palette:**
- Primary: `#7c3aed` (Violet 600) - AI/ML branding
- Secondary: `#1e3a5f` (Dark Blue)
- Accent: `#10b981` (Emerald 500) - Positive predictions
- Warning: `#f59e0b` (Amber 500)
- Danger: `#ef4444` (Red 500) - Stockout alerts
- Background: `#f8fafc` (Slate 50)
- Surface: `#ffffff` (White)

**Typography:**
- Headings: Inter, 600 weight
  - H1: 28px
  - H2: 22px
  - H3: 18px
- Body: Inter, 400 weight, 14px
- Metrics/Numbers: Inter, 700 weight, 24px+

### 5.3 Components

#### 5.3.1 Forecast Chart
- Line chart showing historical data + forecast
- Shaded confidence intervals
- Interactive tooltips
- Zoom and pan capabilities

#### 5.3.2 Stockout Risk Matrix
- Color-coded table (green/yellow/orange/red)
- Sortable columns
- Filter by category/risk level
- Quick action buttons (reorder, dismiss)

#### 5.3.3 Optimization Dashboard
- KPI cards showing potential savings
- Comparison charts (current vs optimized)
- Exportable recommendation list

#### 5.3.4 Production Gantt Chart
- Interactive Gantt view
- Resource allocation visualization
- Conflict highlighting
- Drag-to-reschedule functionality

---

## 6. Data Model

### 6.1 New Entities

#### AIForecast
```
- id: UUID (PK)
- productId: UUID (FK → AluminumProfile)
- forecastDate: DATE
- horizon: INTEGER (weeks)
- predictedQuantity: DECIMAL(10,2)
- confidenceLower: DECIMAL(10,2)
- confidenceUpper: DECIMAL(10,2)
- modelVersion: VARCHAR(50)
- createdAt: TIMESTAMP
```

#### AIStockoutPrediction
```
- id: UUID (PK)
- inventoryItemId: UUID (FK → InventoryItem)
- predictionDate: DATE
- daysToStockout: INTEGER
- riskLevel: ENUM (CRITICAL, HIGH, MEDIUM, LOW)
- recommendedReorderQty: DECIMAL(10,2)
- recommendedReorderDate: DATE
- isAcknowledged: BOOLEAN
- createdAt: TIMESTAMP
```

#### AIInventoryOptimization
```
- id: UUID (PK)
- inventoryItemId: UUID (FK → InventoryItem)
- calculationDate: DATE
- eoq: DECIMAL(10,2)
- reorderPoint: DECIMAL(10,2)
- safetyStock: DECIMAL(10,2)
- expectedAnnualSavings: DECIMAL(10,2)
- modelVersion: VARCHAR(50)
- createdAt: TIMESTAMP
```

#### AIProductionSchedule
```
- id: UUID (PK)
- scheduleDate: DATE
- optimizationType: VARCHAR(50)
- totalMakespan: DECIMAL(10,2)
- conflictsDetected: INTEGER
- generatedSchedule: JSONB
- modelVersion: VARCHAR(50)
- createdAt: TIMESTAMP
```

---

## 7. Integration Points

### 7.1 Existing Module Integration

| Module | Integration Type | Data Flow |
|--------|-----------------|-----------|
| Aluminium | Service calls | Sales history, orders, quotes |
| Stock | Service calls + Events | Inventory levels, movements |
| Maintenance | Service calls | Machine availability, schedules |
| Quality | Service calls | Defect rates, inspection data |
| BI | Shared dashboards | AI insights in BI widgets |

### 7.2 Event-Driven Updates

- Stock movement triggers stockout recalculation
- New sales data triggers forecast retraining
- Production order change triggers schedule optimization

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Metric | Target |
|--------|--------|
| Forecast generation | < 30 seconds |
| Stockout prediction refresh | < 10 seconds |
| Inventory optimization (single item) | < 2 seconds |
| Production schedule optimization | < 5 minutes |
| API response time (cached) | < 200ms |

### 8.2 Accuracy Targets

| Feature | Metric | Target |
|---------|--------|--------|
| Demand Forecasting | MAPE | < 15% |
| Stockout Prediction | Precision | > 85% |
| Inventory Optimization | Cost reduction | > 10% |

### 8.3 Security

- Role-based access control for AI features
- Audit logging for all predictions and overrides
- Data privacy for sensitive customer data used in forecasting

---

## 9. Acceptance Criteria

### 9.1 Demand Forecasting
- [ ] Can generate 12-month forecast for any product
- [ ] Confidence intervals display correctly on chart
- [ ] Manual override is saved and displayed
- [ ] Historical accuracy metrics are available

### 9.2 Stockout Prediction
- [ ] Risk list updates within 1 hour of stock change
- [ ] Alerts integrate with existing notification system
- [ ] Critical stockouts show red highlighting
- [ ] Recommended reorder dates are calculated correctly

### 9.3 Inventory Optimization
- [ ] EOQ calculates correctly with provided parameters
- [ ] Savings estimates are displayed
- [ ] Recommendations can be exported to CSV
- [ ] Minimum order quantities are respected

### 9.4 Production Planning
- [ ] Schedule optimization reduces makespan by > 10%
- [ ] Conflicts are clearly highlighted
- [ ] Capacity forecast shows next 4 weeks
- [ ] Bottleneck analysis identifies top 3 issues

---

## 10. Phased Implementation

### Phase 1: Foundation (Week 1-2)
- Python ML service setup
- Data pipeline from existing modules
- Basic forecasting model (SARIMA)

### Phase 2: Core Features (Week 3-4)
- Demand forecasting API and UI
- Stockout prediction engine
- Integration with Stock alerts

### Phase 3: Advanced Features (Week 5-6)
- Inventory optimization calculations
- Production planning assistant
- Model accuracy tracking

### Phase 4: Polish (Week 7-8)
- UI refinements
- Performance optimization
- Documentation and training

---

*Document Version: 1.0*  
*Created: 2026-03-07*  
*Status: Draft for Review*
