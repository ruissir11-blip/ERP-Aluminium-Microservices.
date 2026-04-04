# AI Module Training Materials

## ERP Aluminium AI Module - User Guide

### Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Demand Forecasting](#demand-forecasting)
4. [Stockout Prediction](#stockout-prediction)
5. [Inventory Optimization](#inventory-optimization)
6. [Production Scheduling](#production-scheduling)
7. [Best Practices](#best-practices)

---

## Introduction

The AI Module provides four main features:
- **Demand Forecasting**: Predict future demand using Prophet, SARIMA, or LSTM models
- **Stockout Prediction**: Early warning system for inventory risks
- **Inventory Optimization**: EOQ calculations and reorder recommendations
- **Production Scheduling**: AI-powered production planning with genetic algorithms

---

## Getting Started

### Accessing the AI Module

1. Log in to ERP Aluminium
2. Navigate to **AI** from the main menu
3. Select the feature you want to use:
   - Demand Forecasting
   - Stockout Prediction
   - Inventory Optimization
   - Production Scheduling

### Prerequisites

- Ensure you have inventory data populated
- Product catalog should be complete
- Historical order data improves forecast accuracy

---

## Demand Forecasting

### Generating a Forecast

1. Go to **AI → Demand Forecasting**
2. Enter a **Product ID**
3. Select **Forecast Horizon** (months)
4. Choose **Model Type**:
   - **Auto**: System selects best model
   - **Prophet**: Best for seasonal data
   - **SARIMA**: Good for complex patterns
   - **LSTM**: Deep learning (requires more data)
5. Set **Confidence Level** (default 95%)
6. Click **Generate Forecast**

### Understanding Results

- **Forecast Chart**: Shows predicted values with confidence bands
- **Model Used**: Which algorithm was selected
- **Accuracy**: Historical accuracy percentage

### Manual Override

If you need to adjust forecasts:

1. Go to **Manual Override** tab
2. Select forecast date
3. Enter your predicted value
4. Click **Apply Override**

---

## Stockout Prediction

### Checking Stockout Risk

1. Go to **AI → Stockout Prediction**
2. Enter **Inventory Item ID**
3. Set **Days Horizon** (30-90 days)
4. Click **Predict Stockout**

### Risk Levels

| Level | Probability | Action Required |
|-------|-------------|------------------|
| 🔴 Critical | >75% | Order immediately |
| 🟠 High | 50-75% | Plan reorder soon |
| 🟡 Medium | 25-50% | Monitor closely |
| 🟢 Low | <25% | Normal monitoring |

### Acknowledging Predictions

When you've addressed a stockout risk:

1. Find the prediction in **All Stockout Predictions**
2. Click the **checkmark** icon
3. Prediction will be marked as acknowledged

---

## Inventory Optimization

### Running Optimization

1. Go to **AI → Inventory Optimization**
2. Enter **Inventory Item ID**
3. Enter **Annual Demand** (units/year)
4. Enter **Unit Cost** ($)
5. Enter **Ordering Cost** ($ per order)
6. Set **Holding Cost Rate** (% of unit cost)
7. Optionally add **Quantity Discounts**
8. Click **Optimize**

### Understanding Results

- **EOQ**: Optimal order quantity (Wilson formula)
- **Safety Stock**: Buffer stock to prevent stockouts
- **Reorder Point**: When to place new order
- **Annual Cost**: Total inventory cost
- **Savings**: Compared to current approach

### Recommendations

Follow the AI-generated recommendations:
- When to reorder
- How much to order
- Cost optimization strategies

---

## Production Scheduling

### Generating a Schedule

1. Go to **AI → Production Scheduling**
2. Review **Orders to Schedule** (auto-populated)
3. Review **Available Machines**
4. Select **Algorithm**:
   - **Genetic Algorithm**: Optimizes for multiple objectives
   - **Priority Rules**: Simple priority-based scheduling
5. Click **Generate Schedule**

### Understanding Results

- **Gantt Chart**: Visual timeline of production
- **Machine Utilization**: % capacity used per machine
- **Conflicts**: Any scheduling conflicts detected

### Schedule Management

- Orders are prioritized by:
  1. Priority level (1 = highest)
  2. Due date
  3. Order quantity

---

## Best Practices

### Demand Forecasting

- Generate forecasts monthly
- Review and override when needed
- Track accuracy over time
- Use at least 12 months of historical data

### Stockout Prediction

- Check predictions daily
- Acknowledge after taking action
- Review high-risk items weekly
- Adjust lead times in settings

### Inventory Optimization

- Review quarterly
- Update costs regularly
- Consider quantity discounts
- Monitor savings achieved

### Production Scheduling

- Run schedules daily
- Update order priorities
- Monitor machine utilization
- Review conflicts

---

## Troubleshooting

### Forecasts Not Generating
- Check product ID exists
- Ensure historical data available
- Try different model type

### Stockout Predictions Inaccurate
- Verify consumption data
- Check lead time settings
- Update inventory quantities

### Optimization Returns Error
- Verify all cost parameters
- Check annual demand > 0
- Ensure unit cost > 0

---

## Support

For technical support:
- Email: support@erp-aluminium.com
- Internal: IT Helpdesk
- Documentation: /docs/ai-module

---

*Last Updated: 2026-03-08*
