# Research Document: Stock Avancé Module

**Feature**: Advanced Stock Management  
**Date**: 2026-03-04  
**Research Areas**: FIFO valuation, lot traceability, audit trails, caching strategies, alert processing

---

## Research Area 1: FIFO Valuation Algorithm

### Decision
Use **perpetual FIFO with transaction-level tracking** rather than periodic FIFO.

### Rationale
- Perpetual FIFO provides real-time stock valuation needed for accurate margin calculations
- Each receipt creates a "layer" with quantity and unit cost
- Each issue consumes from oldest layers first
- Allows for accurate COGS (Cost of Goods Sold) calculation at time of sale

### Implementation Strategy
```typescript
// StockLayer entity tracks each receipt batch
interface StockLayer {
  id: string;
  profileId: string;
  lotNumber: string;
  quantity: Decimal;
  unitCost: Decimal;
  remainingQuantity: Decimal;
  receiptDate: Date;
}

// On issue: consume from oldest layers
async function calculateIssueCost(
  profileId: string, 
  quantity: Decimal
): Promise<{ totalCost: Decimal; layersConsumed: LayerConsumption[] }> {
  // Get layers ordered by receiptDate ASC
  // Consume from each layer until quantity satisfied
  // Return total cost and breakdown by layer
}
```

### Alternatives Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Periodic FIFO (monthly) | Simpler, less data | Inaccurate mid-period valuations, poor for real-time decisions | Rejected |
| Weighted Average | Smooths price fluctuations | Less accurate for aluminum with volatile pricing, harder to trace | Rejected |
| Perpetual FIFO | Real-time accuracy, full traceability | More complex, more data storage | **Selected** |

---

## Research Area 2: Lot Traceability Query Patterns

### Decision
Use **adjacency list with materialized path** for lot traceability, stored in dedicated traceability table.

### Rationale
- Lot traceability requires tracking: Receipt → Production Usage → Customer Order
- Chain must be traversable in both directions (supplier recall → affected customers, customer complaint → supplier lot)
- PostgreSQL recursive CTEs provide efficient tree traversal

### Implementation Strategy
```typescript
// LotTraceability entity records chain links
interface LotTraceability {
  id: string;
  lotId: string;
  parentTraceabilityId: string | null;  // null for root (receipt)
  eventType: 'RECEIPT' | 'PRODUCTION' | 'DELIVERY' | 'RETURN';
  referenceType: string;  // 'PURCHASE_ORDER', 'PRODUCTION_ORDER', etc.
  referenceId: string;
  quantity: Decimal;
  eventDate: Date;
  // Materialized path for fast querying
  path: string;  // '/LOT-001/PROD-123/ORD-456'
}

// Query for full traceability chain
WITH RECURSIVE traceability_chain AS (
  -- Start with lot receipt
  SELECT * FROM lot_traceability WHERE lot_id = :lotId AND parent_traceability_id IS NULL
  UNION ALL
  -- Recursively get children
  SELECT lt.* FROM lot_traceability lt
  JOIN traceability_chain tc ON lt.parent_traceability_id = tc.id
)
SELECT * FROM traceability_chain ORDER BY path;
```

### Alternatives Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Single table with JSON chain | Simple schema | Hard to query, no referential integrity | Rejected |
| Separate tables per event type | Clean separation | Complex joins, harder to traverse | Rejected |
| Adjacency list + materialized path | Flexible, queryable | Slightly more storage | **Selected** |

---

## Research Area 3: Stock Movement Audit Trail Storage

### Decision
Use **dual-write pattern**: Transactional table for current state + append-only audit log.

### Rationale
- Stock levels must be queryable in real-time (transactional table)
- Complete history must be preserved for compliance (audit log)
- Audit log must be immutable and tamper-evident

### Implementation Strategy
```typescript
// Transactional table: current inventory state
// (InventoryItem entity - updated on each movement)

// Audit table: append-only log of all changes
interface StockMovement {
  id: string;
  profileId: string;
  warehouseId: string;
  locationId: string | null;
  lotId: string | null;
  movementType: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'COUNT';
  quantity: Decimal;  // positive for receipt, negative for issue
  unitCost: Decimal | null;
  referenceType: string;
  referenceId: string;
  notes: string;
  performedBy: string;  // user ID
  performedAt: Date;
  ipAddress: string;  // for audit
  // Denormalized for performance
  previousQuantity: Decimal;
  newQuantity: Decimal;
}

// Both tables updated in single database transaction
```

### Alternatives Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Event Sourcing (full) | Complete history as source of truth | Complex to implement, unfamiliar to team | Rejected |
| Snapshot + deltas | Less storage | Reconstruction required for queries | Rejected |
| Dual-write (state + log) | Familiar pattern, good performance | Slightly more code | **Selected** |

---

## Research Area 4: Redis Caching Strategies

### Decision
Use **cache-aside with write-through** for stock levels, with TTL and invalidation.

### Rationale
- Stock levels are read frequently (dashboard, alerts, queries)
- Updates must be consistent across all nodes
- Redis provides fast access but PostgreSQL is source of truth

### Implementation Strategy
```typescript
// Cache key structure
const CACHE_KEYS = {
  stockLevel: (profileId: string, warehouseId: string) => 
    `stock:level:${profileId}:${warehouseId}`,
  stockAlert: (profileId: string, warehouseId: string) => 
    `stock:alert:${profileId}:${warehouseId}`,
  warehouseTotal: (warehouseId: string) => 
    `stock:warehouse:${warehouseId}:total`,
};

// Cache-aside pattern
async function getStockLevel(profileId: string, warehouseId: string): Promise<Decimal> {
  const key = CACHE_KEYS.stockLevel(profileId, warehouseId);
  
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return new Decimal(cached);
  
  // Cache miss: query database
  const level = await inventoryRepository.getLevel(profileId, warehouseId);
  
  // Populate cache with TTL
  await redis.setex(key, 300, level.toString()); // 5 min TTL
  
  return level;
}

// Write-through: update cache on modification
async function updateStock(movement: StockMovement): Promise<void> {
  await db.transaction(async (trx) => {
    // Update database
    await inventoryRepository.update(movement, trx);
    await movementRepository.create(movement, trx);
    
    // Invalidate cache (or update if simple increment/decrement)
    const key = CACHE_KEYS.stockLevel(movement.profileId, movement.warehouseId);
    await redis.del(key);
  });
}
```

### Cache Invalidation Rules
- Receipt/Issue/Adjustment: Invalidate specific stock level cache
- Transfer: Invalidate both source and destination caches
- Lot change: Invalidate lot-specific caches
- Inventory count: Invalidate all warehouse caches after variance approval

### Alternatives Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Write-behind (async) | Better write performance | Risk of inconsistency, complexity | Rejected |
| Read-through | Simpler code | Less control over caching logic | Rejected |
| Cache-aside + write-through | Balanced, familiar | Requires careful invalidation | **Selected** |

---

## Research Area 5: Alert Threshold Processing

### Decision
Use **event-driven with Redis pub/sub**, with scheduled fallback polling.

### Rationale
- Alerts must trigger within 5 minutes of threshold breach
- Event-driven provides immediate response
- Fallback polling catches any missed events

### Implementation Strategy
```typescript
// On stock update, check thresholds
async function checkAlertThresholds(
  profileId: string, 
  warehouseId: string, 
  newLevel: Decimal
): Promise<void> {
  const alert = await alertRepository.getActive(profileId, warehouseId);
  if (!alert) return;
  
  const shouldTrigger = 
    newLevel.lessThan(alert.minimumThreshold) ||
    newLevel.greaterThan(alert.maximumThreshold);
  
  if (shouldTrigger && !alert.isTriggered) {
    // Publish alert event
    await redis.publish('stock:alerts', JSON.stringify({
      type: 'THRESHOLD_BREACH',
      profileId,
      warehouseId,
      currentLevel: newLevel,
      threshold: newLevel.lessThan(alert.minimumThreshold) 
        ? alert.minimumThreshold 
        : alert.maximumThreshold,
      timestamp: new Date()
    }));
    
    await alertRepository.markTriggered(alert.id);
  }
}

// Alert processor (separate worker or scheduled job)
async function processAlertQueue(): Promise<void> {
  const subscriber = redis.duplicate();
  await subscriber.subscribe('stock:alerts');
  
  subscriber.on('message', async (channel, message) => {
    const alert = JSON.parse(message);
    await sendAlertNotification(alert);
  });
}

// Fallback polling job (runs every 5 minutes)
async function scheduledAlertCheck(): Promise<void> {
  const triggered = await alertRepository.findBreachedThresholds();
  for (const alert of triggered) {
    await sendAlertNotification(alert);
  }
}
```

### Notification Channels
1. **Email**: Nodemailer with SMTP configuration
2. **Dashboard**: Real-time via WebSocket or Server-Sent Events
3. **Audit log**: All alerts logged for compliance

### Alternatives Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Pure polling (every 1 min) | Simple, reliable | High database load, delay up to 1 min | Rejected |
| Database triggers | Immediate, guaranteed | Database-specific, harder to maintain | Rejected |
| Event-driven + fallback | Fast, reliable, scalable | More components to manage | **Selected** |

---

## Research Area 6: Inventory Count Variance Handling

### Decision
Use **two-phase workflow**: Draft count → Variance review → Approved adjustment.

### Rationale
- Physical counts often reveal discrepancies
- Variance approval requires supervisor authorization
- Adjustments must be auditable with reason codes

### Implementation Strategy
```typescript
// Inventory count workflow states
enum CountStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  VARIANCE_REVIEW = 'variance_review',
  ADJUSTMENT_APPROVED = 'adjustment_approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Count line with variance tracking
interface InventoryCountLine {
  id: string;
  countId: string;
  profileId: string;
  locationId: string;
  lotId: string | null;
  systemQuantity: Decimal;
  countedQuantity: Decimal;
  variance: Decimal;  // counted - system
  variancePercentage: Decimal;
  reasonCode: 'COUNT_ERROR' | 'THEFT' | 'DAMAGE' | 'SYSTEM_ERROR' | 'OTHER' | null;
  notes: string;
  isAdjusted: boolean;
}

// Workflow
async function submitCountForReview(countId: string): Promise<void> {
  // Calculate variances for all lines
  await calculateVariances(countId);
  
  // Move to review state
  await countRepository.updateStatus(countId, CountStatus.VARIANCE_REVIEW);
  
  // Generate variance report for supervisor
  await generateVarianceReport(countId);
}

async function approveAdjustment(
  countId: string, 
  approvedLines: string[],
  supervisorId: string
): Promise<void> {
  await db.transaction(async (trx) => {
    for (const lineId of approvedLines) {
      const line = await countLineRepository.findById(lineId, trx);
      
      // Create stock movement for adjustment
      await movementRepository.create({
        profileId: line.profileId,
        warehouseId: count.warehouseId,
        locationId: line.locationId,
        movementType: 'COUNT',
        quantity: line.variance,
        referenceType: 'INVENTORY_COUNT',
        referenceId: countId,
        notes: `Variance adjustment: ${line.reasonCode}. ${line.notes}`,
        performedBy: supervisorId
      }, trx);
      
      // Update inventory
      await inventoryRepository.adjust(
        line.profileId, 
        line.warehouseId, 
        line.variance, 
        trx
      );
      
      // Mark line as adjusted
      await countLineRepository.markAdjusted(lineId, trx);
    }
    
    await countRepository.updateStatus(countId, CountStatus.COMPLETED, trx);
  });
}
```

### Reason Codes
- `COUNT_ERROR`: Human error during counting
- `THEFT`: Suspected or confirmed theft
- `DAMAGE`: Material damaged/disposed but not recorded
- `SYSTEM_ERROR`: Error in previous system transactions
- `OTHER`: Other reasons (requires explanation)

### Alternatives Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Immediate auto-adjustment | Fast | No oversight, potential for errors | Rejected |
| Manual adjustment outside count | Flexible | Loses context of why adjustment made | Rejected |
| Two-phase with approval | Controlled, auditable | Longer process | **Selected** |

---

## Summary of Key Decisions

| Area | Decision | Key Factor |
|------|----------|------------|
| FIFO Valuation | Perpetual with layers | Real-time accuracy |
| Lot Traceability | Adjacency list + path | Bidirectional queries |
| Audit Trail | Dual-write pattern | Performance + compliance |
| Caching | Cache-aside + write-through | Consistency |
| Alert Processing | Event-driven + fallback | Responsiveness |
| Inventory Count | Two-phase workflow | Control |

---

**Research Complete**: All technical unknowns resolved, ready for Phase 1 design.
