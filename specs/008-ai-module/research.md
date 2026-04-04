# Research: AI/ML Algorithms for ERP Aluminium

**Module:** 008-ai-module  
**Date:** 2026-03-07  
**Purpose:** Research and evaluate ML algorithms for each AI feature

---

## 1. Executive Summary

This document evaluates machine learning algorithms for the four AI features in the ERP Aluminium predictive module:
1. Demand Forecasting
2. Stockout Prediction
3. Inventory Optimization
4. Production Planning Assistant

---

## 2. Demand Forecasting Algorithms

### 2.1 SARIMA (Seasonal AutoRegressive Integrated Moving Average)

**Description:** Classical statistical time-series model that captures seasonality, trends, and autocorrelation.

**Pros:**
- Well-established, interpretable
- Works well with small datasets (< 1,000 points)
- Built-in seasonality handling
- Low computational requirements

**Cons:**
- Assumes linear relationships
- Manual parameter tuning required
- Less accurate for complex patterns

**Implementation:**
```python
from statsmodels.tsa.statespace.sarimax import SARIMAX
import pandas as pd

def forecast_sarima(data: pd.Series, order=(1,1,1), seasonal_order=(1,1,1,52)):
    model = SARIMAX(data, order=order, seasonal_order=seasonal_order)
    fitted = model.fit(disp=False)
    forecast = fitted.get_forecast(steps=12)
    return forecast.predicted_mean, forecast.conf_int()
```

**Parameters:**
- `p`: AR order (autoregressive)
- `d`: Differencing order
- `q`: MA order (moving average)
- `P, D, Q, s`: Seasonal equivalents + period

**Recommended Use:** Products with stable, seasonal demand patterns.

---

### 2.2 Facebook Prophet

**Description:** Additive model developed by Meta for business time-series with trend, seasonality, and holiday effects.

**Pros:**
- Handles missing data automatically
- Built-in holiday effects
- Easy to use with minimal tuning
- Good for daily data with strong seasonality

**Cons:**
- Less flexible than custom models
- Can miss complex interactions
- Memory-intensive for large datasets

**Implementation:**
```python
from prophet import Prophet
import pandas as pd

def forecast_prophet(data: pd.DataFrame):
    # Prophet requires 'ds' (date) and 'y' (value) columns
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05
    )
    model.fit(data)
    future = model.make_future_dataframe(periods=12, freq='W')
    forecast = model.predict(future)
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
```

**Parameters:**
- `changepoint_prior_scale`: Flexibility of trend (0.01-0.5)
- `seasonality_prior_scale`: Flexibility of seasonality
- `holidays`: Custom holiday dataframe

**Recommended Use:** Products with clear seasonal patterns and holiday effects.

---

### 2.3 LSTM (Long Short-Term Memory) Neural Network

**Description:** Deep learning recurrent neural network capable of learning long-term dependencies.

**Pros:**
- Captures complex nonlinear patterns
- Learns from raw sequential data
- State-of-the-art for many sequence tasks

**Cons:**
- Requires large dataset (> 5,000 points)
- Computationally expensive
- Black box - less interpretable
- Prone to overfitting

**Implementation:**
```python
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

def build_lstm_model(lookback: int):
    model = Sequential([
        LSTM(50, activation='relu', input_shape=(lookback, 1)),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

def create_sequences(data: list, lookback: int):
    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i-lookback:i])
        y.append(data[i])
    return np.array(X), np.array(y)
```

**Architecture:**
- Input: Sequence of past N observations
- Hidden: 1-3 LSTM layers (50-200 units)
- Output: Next step prediction

**Recommended Use:** High-volume products with complex demand patterns.

---

### 2.4 Algorithm Comparison Matrix

| Criteria | SARIMA | Prophet | LSTM |
|----------|--------|---------|------|
| Min Data Required | 52 points | 52 points | 500+ points |
| Training Time | < 1 min | < 1 min | 10-30 min |
| Inference Time | < 1 sec | < 1 sec | < 1 sec |
| Accuracy (Simple) | ★★★★☆ | ★★★★☆ | ★★★☆☆ |
| Accuracy (Complex) | ★★★☆☆ | ★★★★☆ | ★★★★★ |
| Interpretability | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| Implementation | Easy | Easy | Complex |

**Recommendation:**
- Start with **Prophet** for most products (good balance)
- Use **SARIMA** for stable, seasonal products
- Upgrade to **LSTM** for high-volume products after data accumulation

---

## 3. Stockout Prediction Algorithms

### 3.1 Moving Average + Lead Time Model

**Description:** Simple statistical approach using historical consumption rates and lead times.

**Pros:**
- Simple to implement and explain
- No training required
- Fast inference

**Cons:**
- Doesn't capture trends
- Fixed safety stock

**Formula:**
```
Average Daily Consumption = Sum(last 30 days consumption) / 30

Days to Stockout = Current Stock / Average Daily Consumption

Safety Stock = Z × σ × √Lead Time
Where Z = service factor (1.65 for 95%)
      σ = standard deviation of daily consumption
```

---

### 3.2 Exponential Smoothing with Trend

**Description:** Weighted moving average that gives more weight to recent observations, with trend detection.

**Implementation:**
```python
from statsmodels.tsa.holtwinters import ExponentialSmoothing

def predict_consumption_holt(data, periods=30):
    model = ExponentialSmoothing(
        data,
        trend='add',
        seasonal=None,
        damped_trend=True
    )
    fitted = model.fit()
    forecast = fitted.forecast(periods)
    return forecast.sum()  # Total predicted consumption
```

---

### 3.3 Hybrid Approach (Recommended)

**Description:** Combine statistical forecasting with business rules for robust stockout prediction.

**Algorithm:**
1. Use Prophet to forecast consumption for next 30 days
2. Add pending incoming stock
3. Calculate days to stockout
4. Apply business rules for critical items

```python
def calculate_stockout_risk(inventory_item, consumption_forecast, pending_inbound):
    current_stock = inventory_item.quantity
    predicted_consumption = consumption_forecast.sum()
    available_stock = current_stock + pending_inbound - predicted_consumption
    
    if available_stock <= 0:
        return {'risk': 'CRITICAL', 'days_to_stockout': 0}
    
    daily_rate = predicted_consumption / 30
    days_to_stockout = available_stock / daily_rate if daily_rate > 0 else 999
    
    if days_to_stockout <= 7:
        risk = 'CRITICAL'
    elif days_to_stockout <= 14:
        risk = 'HIGH'
    elif days_to_stockout <= 30:
        risk = 'MEDIUM'
    else:
        risk = 'LOW'
    
    return {
        'risk': risk,
        'days_to_stockout': round(days_to_stockout, 1),
        'available_stock': available_stock
    }
```

---

## 4. Inventory Optimization Algorithms

### 4.1 Classical EOQ (Wilson Model)

**Description:** Economic Order Quantity formula that minimizes total inventory costs.

**Formula:**
```
EOQ = √(2 × D × S / H)

Where:
- D = Annual demand (units)
- S = Ordering cost (cost per order)
- H = Holding cost (unit cost × holding rate)
```

**Total Annual Cost:**
```
TAC = (D × C) + (D/EOQ × S) + (EOQ/2 × C × h)

Where:
- C = Unit cost
- h = Holding rate (percentage)
```

---

### 4.2 EOQ with Quantity Discounts

**Description:** Enhanced model considering volume discounts from suppliers.

**Algorithm:**
1. Calculate EOQ for each price break
2. Calculate total cost at each break
3. Add ordering cost
4. Select minimum total cost

```python
def eoq_with_discounts(annual_demand, unit_costs, ordering_cost, holding_rate):
    """
    unit_costs: [(min_qty, price), ...] sorted by quantity
    """
    results = []
    
    # Calculate EOQ first
    base_price = unit_costs[0][1]
    eoq = (2 * annual_demand * ordering_cost / (base_price * holding_rate)) ** 0.5
    
    for min_qty, price in unit_costs:
        # EOQ at this price level
        eoq_level = (2 * annual_demand * ordering_cost / (price * holding_rate)) ** 0.5
        
        # Effective order quantity (max of EOQ and minimum)
        order_qty = max(eoq_level, min_qty)
        
        # Total cost
        purchase_cost = annual_demand * price
        order_cost = (annual_demand / order_qty) * ordering_cost
        holding_cost = (order_qty / 2) * price * holding_rate
        total_cost = purchase_cost + order_cost + holding_cost
        
        results.append({
            'order_qty': order_qty,
            'price': price,
            'total_cost': total_cost,
            'breaks_min_qty': min_qty
        })
    
    return min(results, key=lambda x: x['total_cost'])
```

---

### 4.3 Dynamic Safety Stock (Kanban-inspired)

**Description:** Calculate optimal safety stock based on service level and demand variability.

**Formula:**
```
Safety Stock = Z × σ × √LT

Where:
- Z = Service factor (1.28=90%, 1.65=95%, 2.33=99%)
- σ = Standard deviation of demand during lead time
- √LT = Square root of lead time in days
```

**Implementation:**
```python
import numpy as np
import pandas as pd

def calculate_safety_stock(daily_demand_history, lead_time_days, service_level=0.95):
    """
    Calculate optimal safety stock using normal distribution approximation
    """
    z_scores = {0.90: 1.28, 0.95: 1.65, 0.99: 2.33}
    z = z_scores.get(service_level, 1.65)
    
    # Daily demand statistics
    mean_daily = daily_demand_history.mean()
    std_daily = daily_demand_history.std()
    
    # Demand during lead time
    std_lt = std_daily * np.sqrt(lead_time_days)
    
    # Safety stock
    safety_stock = z * std_lt
    
    # Reorder point
    reorder_point = (mean_daily * lead_time_days) + safety_stock
    
    return {
        'safety_stock': round(safety_stock, 2),
        'reorder_point': round(reorder_point, 2),
        'mean_daily_demand': round(mean_daily, 2)
    }
```

---

## 5. Production Scheduling Algorithms

### 5.1 Genetic Algorithm (GA)

**Description:** Evolutionary algorithm that evolves solution populations over generations.

**Components:**
1. **Chromosome:** Represents a production schedule (order sequence)
2. **Fitness Function:** Minimize makespan, maximize resource utilization
3. **Selection:** Tournament or roulette wheel selection
4. **Crossover:** Combine two parent schedules
5. **Mutation:** Random order swaps

**Implementation:**
```python
import random
import numpy as np

class ProductionScheduler:
    def __init__(self, orders, machines, population_size=100, generations=500):
        self.orders = orders
        self.machines = machines
        self.pop_size = population_size
        self.generations = generations
    
    def create_chromosome(self):
        """Random order sequence"""
        chromosome = self.orders.copy()
        random.shuffle(chromosome)
        return chromosome
    
    def fitness(self, chromosome):
        """Calculate makespan - lower is better"""
        machine_times = {m: 0 for m in self.machines}
        
        for order in chromosome:
            # Assign to machine with earliest availability
            best_machine = min(machine_times, key=machine_times.get)
            machine_times[best_machine] += order.duration
        
        return max(machine_times.values())
    
    def crossover(self, parent1, parent2):
        """Order crossover (OX)"""
        size = len(parent1)
        start, end = sorted(random.sample(range(size), 2))
        
        # Inherit segment from parent1
        child = [None] * size
        child[start:end+1] = parent1[start:end+1]
        
        # Fill remaining with parent2 in order
        parent2_remaining = [o for o in parent2 if o not in child]
        idx = 0
        for i in range(size):
            if child[i] is None:
                child[i] = parent2_remaining[idx]
                idx += 1
        
        return child
    
    def mutate(self, chromosome, mutation_rate=0.1):
        """Swap mutation"""
        if random.random() < mutation_rate:
            i, j = random.sample(range(len(chromosome)), 2)
            chromosome[i], chromosome[j] = chromosome[j], chromosome[i]
        return chromosome
    
    def evolve(self):
        """Main genetic algorithm loop"""
        population = [self.create_chromosome() for _ in range(self.pop_size)]
        
        for gen in range(self.generations):
            # Evaluate fitness
            fitness_scores = [(chrom, self.fitness(chrom)) for chrom in population]
            fitness_scores.sort(key=lambda x: x[1])
            
            # Elitism - keep best
            elites = [f[0] for f in fitness_scores[:10]]
            
            # Generate new population
            new_pop = elites.copy()
            while len(new_pop) < self.pop_size:
                parent1, parent2 = random.sample(elites, 2)
                child = self.crossover(parent1, parent2)
                child = self.mutate(child)
                new_pop.append(child)
            
            population = new_pop
        
        # Return best solution
        return min(population, key=self.fitness)
```

---

### 5.2 Priority Rules Heuristic

**Description:** Simple rule-based scheduling for quick results.

**Rules:**
- **SPT:** Shortest Processing Time first
- **EDD:** Earliest Due Date first
- **CR:** Critical Ratio = (Due Date - Today) / Processing Time
- **FCFS:** First Come First Served

**Implementation:**
```python
def schedule_priority(orders, rule='CR'):
    if rule == 'SPT':
        return sorted(orders, key=lambda x: x.duration)
    elif rule == 'EDD':
        return sorted(orders, key=lambda x: x.due_date)
    elif rule == 'CR':
        today = pd.Timestamp.now()
        return sorted(orders, key=lambda x: (x.due_date - today).days / x.duration)
    else:
        return orders  # FCFS
```

---

### 5.3 Conflict Detection

**Description:** Identify resource conflicts in proposed schedules.

```python
def detect_conflicts(schedule, machines, materials, labor):
    conflicts = []
    
    for day in schedule.keys():
        day_schedule = schedule[day]
        
        # Check machine capacity
        machine_usage = {}
        for order in day_schedule:
            for machine in order.required_machines:
                machine_usage[machine] = machine_usage.get(machine, 0) + 1
                if machine_usage[machine] > machines[machine].capacity:
                    conflicts.append({
                        'type': 'MACHINE',
                        'severity': 'HIGH',
                        'resource': machine,
                        'day': day,
                        'orders': [o.id for o in day_schedule]
                    })
        
        # Check material availability
        for order in day_schedule:
            for material, qty in order.materials.items():
                if qty > materials.get(material, 0):
                    conflicts.append({
                        'type': 'MATERIAL',
                        'severity': 'CRITICAL',
                        'resource': material,
                        'order': order.id,
                        'required': qty,
                        'available': materials.get(material, 0)
                    })
    
    return conflicts
```

---

## 6. Technology Recommendations

### 6.1 Python ML Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Python | 3.11+ |
| Time Series | statsmodels | 0.14+ |
| Forecasting | Prophet | 1.1+ |
| Deep Learning | TensorFlow / Keras | 2.15+ |
| Numerical | NumPy | 1.26+ |
| Data | Pandas | 2.1+ |
| Optimization | SciPy | 1.12+ |

### 6.2 Model Management

| Component | Technology | Purpose |
|-----------|------------|---------|
| Experiment Tracking | MLflow | Track experiments, parameters, metrics |
| Model Registry | MLflow | Version and deploy models |
| Scheduling | Celery | Async training jobs |
| Monitoring | Prometheus + Grafana | Model performance monitoring |

---

## 7. Implementation Strategy

### Phase 1: Quick Wins (Weeks 1-2)
- Implement EOQ calculations (deterministic, no training)
- Implement basic moving average for stockout
- Use Prophet for demand forecasting

### Phase 2: Refinement (Weeks 3-4)
- Add SARIMA as alternative forecaster
- Implement genetic algorithm for scheduling
- Add model accuracy tracking

### Phase 3: Advanced (Weeks 5-6)
- Train LSTM for high-volume products
- Implement dynamic safety stock
- Add conflict resolution AI

---

*Document Version: 1.0*  
*Created: 2026-03-07*
