# AI Module Workflows

**Module:** 008-ai-module  
**Date:** 2026-03-07  
**Purpose:** Document key workflows and process diagrams for the AI Predictive Module

---

## 1. Demand Forecasting Workflow

### 1.1 Forecast Generation Flow

```mermaid
flowchart TD
    A[User requests forecast] --> B{Product has history?}
    B -->|No| C[Use product category average]
    B -->|Yes| D{Enough data points?}
    D -->|No < 52 points| E[Use SARIMA]
    D -->|Yes > 52 points| F{Run model selection}
    F --> G[Train Prophet]
    F --> H[Train SARIMA]
    G --> I[Compare accuracy]
    H --> I
    I --> J[Select best model]
    J --> K[Generate forecast]
    K --> L[Calculate confidence intervals]
    L --> M[Store in database]
    M --> N[Return to user]
    
    C --> N
    E --> N
```

### 1.2 Forecast Retraining Flow

```mermaid
flowchart TD
    A[Scheduled: Weekly] --> B[Collect new sales data]
    B --> C[Preprocess data]
    C --> D[Retrain Prophet model]
    D --> E[Retrain SARIMA model]
    E --> F[Calculate MAPE for both]
    F --> G[Select best model]
    G --> H{Accuracy improved?}
    H -->|Yes| I[Deploy new model]
    H -->|No| J[Keep current model]
    I --> K[Update model version in MLflow]
    J --> L[Log performance]
    K --> L
    L --> M[End]
```

---

## 2. Stockout Prediction Workflow

### 2.1 Stockout Risk Calculation

```mermaid
flowchart TD
    A[Scheduled: Hourly] --> B[Fetch all inventory items]
    B --> C[For each item]
    C --> D{Item has consumption history?}
    D -->|No| E[Skip item]
    D -->|Yes| F[Calculate avg daily consumption]
    F --> G[Get current stock level]
    G --> H[Get pending inbound orders]
    H --> I[Calculate: Days to Stockout]
    I --> J{Calculate risk level}
    J -->|Days <= 7| K[RISK: CRITICAL]
    J -->|Days <= 14| L[RISK: HIGH]
    J -->|Days <= 30| M[RISK: MEDIUM]
    J -->|Days > 30| N[RISK: LOW]
    
    K --> O[Create/Update prediction]
    L --> O
    M --> O
    N --> O
    
    O --> P{Risk >= HIGH?}
    P -->|Yes| Q[Create StockAlert]
    P -->|No| R[Skip alert]
    Q --> S[Notify users]
    R --> C
    S --> T[End]
    E --> C
```

### 2.2 Stockout Alert Workflow

```mermaid
flowchart TD
    A[New stockout prediction] --> B{Risk level}
    B -->|CRITICAL| C[Send immediate notification]
    B -->|HIGH| D[Send notification]
    B -->|MEDIUM| E[Add to daily digest]
    B -->|LOW| F[Log only]
    
    C --> G{User acknowledges?}
    D --> G
    E --> G
    F --> H[End]
    
    G -->|Yes| I[Mark as acknowledged]
    G -->|No| J{24 hours passed?}
    J -->|Yes| K[Resend notification]
    J -->|No| L[Wait]
    K --> G
    L --> G
    
    I --> H
```

---

## 3. Inventory Optimization Workflow

### 3.1 EOQ Calculation Flow

```mermaid
flowchart TD
    A[Trigger: Daily or Manual] --> B[Fetch item parameters]
    B --> C[Get annual demand from forecast]
    C --> D[Get unit cost]
    D --> E[Get ordering cost]
    E --> F[Get holding cost rate]
    F --> G[Get supplier lead time]
    G --> H[Get minimum order qty]
    H --> I[Calculate EOQ]
    I --> J{Quantity discounts?}
    J -->|Yes| K[Calculate for each tier]
    J -->|No| L[Use basic EOQ]
    K --> M[Find minimum total cost]
    L --> M
    M --> N[Calculate reorder point]
    N --> O[Calculate safety stock]
    O --> P[Calculate expected savings]
    P --> Q[Store results]
    Q --> R[Generate recommendations]
    R --> S[End]
```

### 3.2 Reorder Recommendation Flow

```mermaid
flowchart TD
    A[Daily check] --> B[For each optimized item]
    B --> C{Stock <= Reorder Point?}
    C -->|Yes| D{Create recommendation}
    D --> E{Already recommended?}
    E -->|No| F[Create new recommendation]
    E -->|Yes| G{Order placed?}
    G -->|No| H[Update recommendation]
    G -->|Yes| I[Mark as ordered]
    
    C -->|No| J[Skip]
    
    F --> K[Notify user]
    H --> K
    I --> K
    
    J --> B
    K --> L[End]
```

---

## 4. Production Planning Workflow

### 4.1 Schedule Optimization Flow

```mermaid
flowchart TD
    A[User requests optimization] --> B[Fetch production orders]
    B --> C[Get machine availability]
    C --> D[Get material availability]
    D --> E[Get labor availability]
    E --> F[Get maintenance schedule]
    F --> G[Initialize Genetic Algorithm]
    
    G --> H[Generate initial population]
    H --> I[For each generation]
    I --> J[Calculate fitness]
    J --> K[Select parents]
    K --> L[Crossover]
    L --> M[Mutate]
    M --> N{Generate new population}
    N --> I
    
    I --> O{Max generations?}
    O -->|No| P[Continue]
    O -->|Yes| Q[Select best schedule]
    
    Q --> R[Detect conflicts]
    R --> S{Conflicts found?}
    S -->|Yes| T[Generate resolution suggestions]
    S -->|No| U[Save schedule]
    
    T --> U
    U --> V[Return to user]
```

### 4.2 Conflict Detection Flow

```mermaid
flowchart TD
    A[Generated schedule] --> B[Analyze by time slot]
    B --> C{For each time slot}
    
    C --> D{Check machine capacity}
    D --> E{Over capacity?}
    E -->|Yes| F[Add machine conflict]
    E -->|No| G[Check materials]
    
    G --> H{Materials available?}
    H -->|No| I[Add material conflict]
    H -->|Yes| J[Check labor]
    
    J --> K{Labor available?}
    K -->|No| L[Add labor conflict]
    K -->|Yes| M[Check next slot]
    
    F --> N[Collect conflicts]
    I --> N
    L --> N
    
    N --> O{Suggest resolutions}
    O --> P[End]
    
    M --> C
```

---

## 5. Data Pipeline Workflow

### 5.1 Data Collection Flow

```mermaid
flowchart TD
    A[Modules] --> B[Aluminium - Sales data]
    A --> C[Stock - Inventory data]
    A --> D[Maintenance - Machine data]
    A --> E[Quality - Defect data]
    
    B --> F[Data Aggregation Service]
    C --> F
    D --> F
    E --> F
    
    F --> G{Data validation}
    G -->|Pass| H[Store in raw table]
    G -->|Fail| I[Log errors]
    I --> J[Alert admin]
    
    H --> K[Preprocess data]
    K --> L[Feature engineering]
    L --> M[Store in feature store]
    M --> N[Ready for ML training]
```

### 5.2 Model Training Flow

```mermaid
flowchart TD
    A[Scheduled or Manual] --> B[Load training data]
    B --> C[Split: train/test/validation]
    C --> D[Preprocess features]
    D --> E[Train model]
    E --> F{Evaluate on validation}
    F --> G[Calculate metrics]
    G --> H{Meet accuracy target?}
    H -->|Yes| I[Register in MLflow]
    H -->|No| J[Tune hyperparameters]
    J --> E
    
    I --> K[Deploy to staging]
    K --> L{A/B testing?}
    L -->|Yes| M[Run A/B test]
    L -->|No| N[Deploy to production]
    
    M --> O{Test passed?}
    O -->|Yes| N
    O -->|No| P[Rollback]
    P --> J
    
    N --> Q[Schedule monitoring]
```

---

## 6. Integration Flows

### 6.1 Event-Driven Updates

```mermaid
flowchart TD
    A[Stock Movement Event] --> B[Update inventory cache]
    B --> C{Type of movement?}
    C -->|OUTBOUND| D[Trigger stockout recalculation]
    C -->|INBOUND| E[Update stock levels]
    
    D --> F[Recalculate for item]
    F --> G{New risk level?}
    G -->|Yes| H[Update prediction]
    G -->No| I[Skip]
    H --> J{Create alert?}
    J -->|Yes| K[Create notification]
    J -->|No| L[End]
    
    E --> L
    I --> L
    K --> L
    
    C -->|INVENTORY_ADJUST| L
```

### 6.2 BI Dashboard Integration

```mermaid
flowchart TD
    A[AI Module] --> B[Forecast data]
    A --> C[Stockout risk data]
    A --> D[Optimization savings]
    A --> E[Capacity utilization]
    
    B --> F[BI Dashboard Service]
    C --> F
    D --> F
    E --> F
    
    F --> G[Aggregate metrics]
    G --> H[Store in BI database]
    H --> I[Dashboard renders widgets]
    I --> J[User views dashboard]
```

---

## 7. Error Handling Workflows

### 7.1 Model Failure Handling

```mermaid
flowchart TD
    A[Model prediction fails] --> B{Error type?}
    B -->|Timeout| C[Use cached prediction]
    B -->|Data missing| D[Use fallback model]
    B -->|Model error| E[Log error details]
    
    C --> F[Return to user with warning]
    D --> G[Try simpler model]
    G --> H{Simpler model works?}
    H -->|Yes| I[Return fallback result]
    H -->|No| J[Return error]
    
    E --> K[Alert ML team]
    K --> L[Investigate issue]
    L --> M{Fix available?}
    M -->|Yes| N[Redeploy model]
    M -->|No| O[Disable model]
    
    N --> P[Resume service]
    O --> Q[Use alternative]
    
    F --> R[End]
    I --> R
    J --> R
    P --> R
    Q --> R
```

---

*Document Version: 1.0*  
*Created: 2026-03-07*
