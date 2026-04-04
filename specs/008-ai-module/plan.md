# Implementation Plan: AI Predictive Module

**Module:** 008-ai-module  
**Date:** 2026-03-07  
**Timeline:** 8 weeks

---

## 1. Executive Summary

This plan outlines the implementation of the AI Predictive Module for ERP Aluminium. The module adds intelligent prediction and optimization capabilities across four main features: Demand Forecasting, Stockout Prediction, Inventory Optimization, and Production Planning Assistant.

**Key Milestones:**
- Week 2: Foundation complete - Python ML service operational
- Week 4: Core features live - Forecasting and Stockout Prediction
- Week 6: Advanced features live - Inventory Optimization and Production Planning
- Week 8: Polish and deployment

---

## 2. Resource Allocation

### 2.1 Team Composition

| Role | Count | Allocation |
|------|-------|------------|
| Backend Developer (Node.js) | 1 | 50% |
| Python/ML Engineer | 1 | 100% |
| Frontend Developer | 1 | 30% |
| DevOps Engineer | 0.5 | 25% |
| QA Engineer | 1 | 30% |

### 2.2 Technology Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Backend API |
| Python | 3.11+ | ML runtime |
| PostgreSQL | 14+ | Database + TimescaleDB |
| Redis | 7.x | Caching + Job Queue |
| MLflow | Latest | Model registry |
| Docker | 24+ | Containerization |

---

## 3. Phase Breakdown

### Phase 1: Foundation (Week 1-2)

**Goal:** Establish the ML infrastructure and basic forecasting capability.

#### Week 1: Infrastructure Setup

| Task | Owner | Deliverable |
|------|-------|-------------|
| Set up Python ML service structure | ML Engineer | Python project scaffold |
| Configure PostgreSQL with TimescaleDB | DevOps | Database extension enabled |
| Create AI module database migrations | Backend Dev | Migration files |
| Set up MLflow for model tracking | ML Engineer | MLflow server running |
| Configure Redis job queue | Backend Dev | BullMQ setup |
| Create Docker configuration | DevOps | docker-compose.ai.yml |

**Week 1 Complete Criteria:**
- Python service can be started locally
- Database migrations run successfully
- MLflow accessible at localhost:5001

#### Week 2: Basic Forecasting

| Task | Owner | Deliverable |
|------|-------|-------------|
| Implement data pipeline from Aluminium module | Backend Dev | Sales data extraction service |
| Create Prophet forecasting model | ML Engineer | Working Prophet model |
| Build forecast API endpoints | Backend Dev | /api/ai/forecast/* endpoints |
| Add model versioning in MLflow | ML Engineer | Version tracking working |
| Create forecast storage in database | Backend Dev | AIForecast entity + CRUD |

**Week 2 Complete Criteria:**
- Can generate 12-week forecast for any product
- Forecasts are stored in database
- Model version is tracked in MLflow

---

### Phase 2: Core Features (Week 3-4)

**Goal:** Deploy Demand Forecasting and Stockout Prediction to production.

#### Week 3: Demand Forecasting Enhancement

| Task | Owner | Deliverable |
|------|-------|-------------|
| Add SARIMA as alternative model | ML Engineer | SARIMA implementation |
| Implement model selection logic | ML Engineer | Auto-select best model |
| Add confidence intervals | ML Engineer | 80% and 95% intervals |
| Create forecast accuracy tracking | ML Engineer | MAPE calculation |
| Build forecast UI components | Frontend Dev | Forecast chart component |
| Add manual override feature | Backend Dev | Override API + UI |

**Week 3 Complete Criteria:**
- Users can view forecast with confidence bands
- Forecast accuracy is tracked and displayed
- Manual overrides are saved

#### Week 4: Stockout Prediction

| Task | Owner | Deliverable |
|------|-------|-------------|
| Implement consumption prediction | ML Engineer | Daily consumption model |
| Build stockout risk calculation | ML Engineer | Days-to-stockout algorithm |
| Integrate with existing StockAlert | Backend Dev | AI alerts in alert system |
| Create stockout risk dashboard | Frontend Dev | Risk matrix UI |
| Add acknowledgment workflow | Backend Dev | Acknowledge API |
| Set up hourly prediction refresh | Backend Dev | Cron job for predictions |

**Week 4 Complete Criteria:**
- Stockout risk list is updated hourly
- Critical alerts integrate with notification system
- Users can acknowledge and dismiss alerts

---

### Phase 3: Advanced Features (Week 5-6)

**Goal:** Deploy Inventory Optimization and Production Planning.

#### Week 5: Inventory Optimization

| Task | Owner | Deliverable |
|------|-------|-------------|
| Implement EOQ calculations | ML Engineer | Wilson model implementation |
| Add quantity discount handling | ML Engineer | Discount optimization |
| Build safety stock calculation | ML Engineer | Dynamic safety stock |
| Create optimization API endpoints | Backend Dev | /api/ai/inventory/* endpoints |
| Build optimization dashboard | Frontend Dev | Savings dashboard |
| Add reorder recommendations | Backend Dev | Recommendation engine |

**Week 5 Complete Criteria:**
- EOQ is calculated for all stocked items
- Potential savings are displayed
- Reorder recommendations are actionable

#### Week 6: Production Planning

| Task | Owner | Deliverable |
|------|-------|-------------|
| Implement genetic algorithm | ML Engineer | GA scheduler |
| Add priority rule heuristics | ML Engineer | SPT, EDD, CR rules |
| Build conflict detection | ML Engineer | Resource conflict finder |
| Create production schedule API | Backend Dev | /api/ai/planning/* endpoints |
| Build Gantt chart UI | Frontend Dev | Interactive schedule view |
| Add capacity forecasting | ML Engineer | Load prediction |

**Week 6 Complete Criteria:**
- Schedule optimization reduces makespan
- Resource conflicts are detected and highlighted
- Capacity forecast is available

---

### Phase 4: Polish (Week 7-8)

**Goal:** Performance optimization, testing, and deployment.

#### Week 7: Performance & Testing

| Task | Owner | Deliverable |
|------|-------|-------------|
| Optimize forecast generation speed | ML Engineer | < 30 sec target |
| Add caching layer | Backend Dev | Redis caching |
| Performance load testing | QA Engineer | Load test report |
| Integration testing | QA Engineer | Full integration tests |
| Security review | DevOps | Security audit |
| API documentation | Backend Dev | Swagger docs complete |

**Week 7 Complete Criteria:**
- All performance targets met
- Tests pass with > 80% coverage
- Security audit passed

#### Week 8: Deployment & Training

| Task | Owner | Deliverable |
|------|-------|-------------|
| Production deployment | DevOps | Live deployment |
| Monitoring setup | DevOps | Prometheus + Grafana |
| Documentation finalization | ML Engineer | User guides |
| Training sessions | All | Team training complete |
| Rollout to users | Project Manager | Phased user rollout |
| Post-launch support | Team | Issue resolution |

**Week 8 Complete Criteria:**
- Module is live in production
- Monitoring is operational
- Users are trained

---

## 4. Risk Management

### 4.1 Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data quality issues | High | High | Implement data validation pipeline early |
| Model accuracy below target | Medium | High | Start with simple models, iterate |
| Python/Node integration delays | Medium | Medium | Use REST API, avoid tight coupling |
| Resource constraints | Low | Medium | Use cloud scaling, optimize algorithms |
| User adoption | Medium | Medium | Invest in UI/UX, provide training |

### 4.2 Contingency Plans

- **If Prophet fails:** Fall back to SARIMA
- **If training is slow:** Use smaller datasets, batch processing
- **If accuracy is low:** Increase training data, tune hyperparameters

---

## 5. Success Metrics

### 5.1 Technical Metrics

| Metric | Target |
|--------|--------|
| Forecast generation time | < 30 seconds |
| Stockout prediction refresh | < 10 seconds |
| API response time (cached) | < 200ms |
| Model accuracy (MAPE) | < 15% |
| System uptime | > 99.5% |

### 5.2 Business Metrics

| Metric | Target |
|--------|--------|
| Stockout prevention rate | > 85% |
| Inventory cost reduction | > 10% |
| Production makespan reduction | > 10% |
| User satisfaction | > 4/5 |

---

## 6. Gantt Chart Summary

```
Week:    1  2  3  4  5  6  7  8
         |  |  |  |  |  |  |  |
Phase 1  ████████
Phase 2        ████████
Phase 3              ████████
Phase 4                    ████████
```

---

## 7. Dependencies on Other Modules

| Module | Dependency | Notes |
|--------|------------|-------|
| 002-Module-Aluminium | Data source | Sales, orders, quotes |
| 003-Module-Stock | Data source | Inventory, movements |
| 004-Module-Maintenance | Integration | Machine availability |
| 006-Comptabilite | Data source | Cost data for optimization |
| 007-BI-Dashboards | Integration | AI widgets in dashboards |

---

## 8. Approval

| Role | Name | Date | Signature |
|------|------|------|------------|
| Project Manager | | | |
| Technical Lead | | | |
| ML Engineer | | | |

---

*Document Version: 1.0*  
*Created: 2026-03-07*
