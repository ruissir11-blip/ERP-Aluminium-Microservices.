# Data Model: Stock Avancé Module

**Module**: Advanced Stock Management  
**Date**: 2026-03-04  
**Source**: Feature specification entities + research decisions

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Warehouse     │────▶│ StorageLocation  │◀────│  InventoryItem  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  StockMovement  │     │    StockAlert    │     │      Lot        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ InventoryCount  │────▶│InventoryCountLine│     │ LotTraceability │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         │
         ▼
┌─────────────────┐
│  StockLayer     │  (for FIFO valuation)
└─────────────────┘
```

---

## Entity Definitions

### Warehouse

Represents a physical storage location (site, building, or external storage facility).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| code | VARCHAR(20) | UNIQUE, NOT NULL | Short code (e.g., "MAIN", "NORD") |
| name | VARCHAR(100) | NOT NULL | Display name |
| address | TEXT | NULL | Full address |
| contactName | VARCHAR(100) | NULL | Contact person |
| contactEmail | VARCHAR(255) | NULL | Contact email |
| contactPhone | VARCHAR(20) | NULL | Contact phone |
| isActive | BOOLEAN | DEFAULT true | Soft delete flag |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last modification |

**Relationships**:
- One-to-Many: Warehouse → StorageLocation
- One-to-Many: Warehouse → InventoryItem
- One-to-Many: Warehouse → StockMovement
- One-to-Many: Warehouse → InventoryCount

---

### StorageLocation

Represents a specific bin/rack/position within a warehouse (zone → rack → aisle → level).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| warehouseId | UUID | FK → Warehouse | Parent warehouse |
| zone | VARCHAR(50) | NOT NULL | Zone identifier (e.g., "A", "B1") |
| rack | VARCHAR(50) | NOT NULL | Rack identifier (e.g., "R12") |
| aisle | VARCHAR(50) | NOT NULL | Aisle identifier (e.g., "A3") |
| level | VARCHAR(20) | NOT NULL | Level/shelf (e.g., "L2", "GND") |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Full location code (e.g., "MAIN-A-R12-A3-L2") |
| maxWeight | DECIMAL(10,2) | NULL | Maximum weight capacity (kg) |
| maxVolume | DECIMAL(10,2) | NULL | Maximum volume capacity (m³) |
| isActive | BOOLEAN | DEFAULT true | Soft delete flag |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Relationships**:
- Many-to-One: StorageLocation → Warehouse
- One-to-Many: StorageLocation → InventoryItem

**Validation Rules**:
- Code must be unique across all locations
- (zone, rack, aisle, level) combination must be unique within warehouse

---

### Lot

Represents a batch of material from a supplier with full traceability information.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| lotNumber | VARCHAR(50) | NOT NULL | Supplier or internal lot number |
| profileId | UUID | FK → AluminumProfile | Related aluminum profile |
| supplierId | UUID | FK → Customer (role=SUPPLIER) | Supplier reference |
| receiptDate | DATE | NOT NULL | Date of receipt |
| initialQuantity | DECIMAL(10,3) | NOT NULL | Original quantity received |
| remainingQuantity | DECIMAL(10,3) | NOT NULL | Current available quantity |
| unitCost | DECIMAL(12,4) | NOT NULL | Cost per unit at receipt |
| certificateOfConformity | VARCHAR(255) | NULL | COC document reference |
| expiryDate | DATE | NULL | Material expiry if applicable |
| qualityStatus | ENUM | DEFAULT 'APPROVED' | APPROVED, QUARANTINE, REJECTED |
| notes | TEXT | NULL | Additional notes |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Relationships**:
- Many-to-One: Lot → AluminumProfile
- Many-to-One: Lot → Customer (supplier)
- One-to-Many: Lot → LotTraceability
- One-to-Many: Lot → StockLayer

**Validation Rules**:
- remainingQuantity ≤ initialQuantity
- expiryDate > receiptDate (if both provided)

---

### InventoryItem

Represents the current stock of a specific profile at a specific location.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| profileId | UUID | FK → AluminumProfile | Aluminum profile |
| warehouseId | UUID | FK → Warehouse | Warehouse location |
| locationId | UUID | FK → StorageLocation | Specific location (nullable) |
| lotId | UUID | FK → Lot | Lot reference (nullable) |
| quantityOnHand | DECIMAL(10,3) | NOT NULL, DEFAULT 0 | Physical quantity available |
| quantityReserved | DECIMAL(10,3) | NOT NULL, DEFAULT 0 | Quantity reserved for orders |
| quantityAvailable | DECIMAL(10,3) | COMPUTED | onHand - reserved |
| averageUnitCost | DECIMAL(12,4) | NULL | Weighted average cost |
| lastMovementDate | TIMESTAMP | NULL | Date of last movement |
| version | INTEGER | NOT NULL, DEFAULT 0 | Optimistic locking version |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last modification |

**Relationships**:
- Many-to-One: InventoryItem → AluminumProfile
- Many-to-One: InventoryItem → Warehouse
- Many-to-One: InventoryItem → StorageLocation (optional)
- Many-to-One: InventoryItem → Lot (optional)

**Validation Rules**:
- quantityOnHand ≥ 0
- quantityReserved ≤ quantityOnHand
- quantityAvailable = quantityOnHand - quantityReserved
- version incremented on every update (optimistic locking)

**Indexes**:
- (profileId, warehouseId, locationId, lotId) - UNIQUE for location-specific tracking
- (warehouseId) - For warehouse-level queries
- (profileId) - For product-level queries

---

### StockMovement

Records every change to inventory quantities - append-only audit log.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| profileId | UUID | FK → AluminumProfile | Affected profile |
| warehouseId | UUID | FK → Warehouse | Warehouse |
| locationId | UUID | FK → StorageLocation | Specific location (nullable) |
| lotId | UUID | FK → Lot | Lot reference (nullable) |
| movementType | ENUM | NOT NULL | RECEIPT, ISSUE, TRANSFER, ADJUSTMENT, COUNT |
| quantity | DECIMAL(10,3) | NOT NULL | Change amount (positive=receipt, negative=issue) |
| unitCost | DECIMAL(12,4) | NULL | Cost per unit (for receipts) |
| totalCost | DECIMAL(14,4) | NULL | Total cost of movement |
| referenceType | VARCHAR(50) | NOT NULL | PURCHASE_ORDER, PRODUCTION_ORDER, DELIVERY, etc. |
| referenceId | VARCHAR(50) | NOT NULL | ID of reference document |
| sourceWarehouseId | UUID | FK → Warehouse | For transfers: source (nullable) |
| notes | TEXT | NULL | Additional notes |
| performedBy | UUID | FK → User | User who performed action |
| performedAt | TIMESTAMP | NOT NULL | Timestamp of action |
| ipAddress | VARCHAR(45) | NULL | Client IP for audit |
| previousQuantity | DECIMAL(10,3) | NOT NULL | Stock level before movement |
| newQuantity | DECIMAL(10,3) | NOT NULL | Stock level after movement |

**Relationships**:
- Many-to-One: StockMovement → AluminumProfile
- Many-to-One: StockMovement → Warehouse
- Many-to-One: StockMovement → StorageLocation (optional)
- Many-to-One: StockMovement → Lot (optional)
- Many-to-One: StockMovement → User

**Indexes**:
- (profileId, performedAt) - For product history queries
- (warehouseId, performedAt) - For warehouse history queries
- (referenceType, referenceId) - For document lookups
- (performedAt) - For time-range queries

---

### StockAlert

Defines alert thresholds for a product/warehouse combination.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| profileId | UUID | FK → AluminumProfile | Monitored profile |
| warehouseId | UUID | FK → Warehouse | Monitored warehouse (NULL = all) |
| minimumThreshold | DECIMAL(10,3) | NOT NULL | Alert when below this level |
| maximumThreshold | DECIMAL(10,3) | NULL | Alert when above this level |
| reorderPoint | DECIMAL(10,3) | NULL | Suggested reorder quantity |
| emailRecipients | TEXT[] | NULL | Array of email addresses |
| isActive | BOOLEAN | DEFAULT true | Alert enabled/disabled |
| isTriggered | BOOLEAN | DEFAULT false | Current alert state |
| lastTriggeredAt | TIMESTAMP | NULL | Last alert timestamp |
| acknowledgedAt | TIMESTAMP | NULL | When alert was acknowledged |
| acknowledgedBy | UUID | FK → User | User who acknowledged |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last modification |

**Relationships**:
- Many-to-One: StockAlert → AluminumProfile
- Many-to-One: StockAlert → Warehouse (optional, NULL = all warehouses)
- Many-to-One: StockAlert → User (acknowledgedBy)

**Validation Rules**:
- minimumThreshold ≥ 0
- maximumThreshold > minimumThreshold (if provided)
- reorderPoint > 0 (if provided)

**Indexes**:
- (profileId, warehouseId) - UNIQUE constraint
- (isActive, isTriggered) - For active alert queries

---

### LotTraceability

Records the chain of custody for lot-tracked items.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| lotId | UUID | FK → Lot | Related lot |
| parentTraceabilityId | UUID | FK → LotTraceability | Parent event (NULL for root) |
| eventType | ENUM | NOT NULL | RECEIPT, PRODUCTION, DELIVERY, RETURN, TRANSFER |
| eventDate | TIMESTAMP | NOT NULL | When event occurred |
| referenceType | VARCHAR(50) | NOT NULL | Document type (PURCHASE_ORDER, etc.) |
| referenceId | VARCHAR(50) | NOT NULL | Document ID |
| quantity | DECIMAL(10,3) | NOT NULL | Quantity involved in this event |
| remainingQuantity | DECIMAL(10,3) | NOT NULL | Quantity remaining after this event |
| path | VARCHAR(500) | NOT NULL | Materialized path for fast queries |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Relationships**:
- Many-to-One: LotTraceability → Lot
- Many-to-One: LotTraceability → LotTraceability (parent, self-referencing)
- One-to-Many: LotTraceability → LotTraceability (children)

**Validation Rules**:
- Path format: /LOT-{id}/EVENT-{id}/...
- Root events have parentTraceabilityId = NULL
- remainingQuantity decreases through the chain

**Indexes**:
- (lotId, path) - For chain traversal
- (path) - GIN index for path queries
- (referenceType, referenceId) - For document lookups

---

### InventoryCount

Represents a physical stocktaking session.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| countNumber | VARCHAR(20) | UNIQUE, NOT NULL | Human-readable count number (e.g., "IC-2024-001") |
| warehouseId | UUID | FK → Warehouse | Warehouse being counted |
| status | ENUM | NOT NULL | DRAFT, IN_PROGRESS, VARIANCE_REVIEW, ADJUSTMENT_APPROVED, COMPLETED, CANCELLED |
| countType | ENUM | NOT NULL | FULL, CYCLE, SPOT |
| startedAt | TIMESTAMP | NULL | When count began |
| completedAt | TIMESTAMP | NULL | When count finished |
| initiatedBy | UUID | FK → User | User who created count |
| reviewedBy | UUID | FK → User | Supervisor who reviewed |
| reviewedAt | TIMESTAMP | NULL | When review completed |
| notes | TEXT | NULL | General notes |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last modification |

**Relationships**:
- Many-to-One: InventoryCount → Warehouse
- Many-to-One: InventoryCount → User (initiatedBy)
- Many-to-One: InventoryCount → User (reviewedBy)
- One-to-Many: InventoryCount → InventoryCountLine

**State Transitions**:
```
DRAFT → IN_PROGRESS → VARIANCE_REVIEW → ADJUSTMENT_APPROVED → COMPLETED
  ↓         ↓              ↓                      ↓
CANCELLED  (can go       (can go                (can go
            back to        back to               back to
            DRAFT)         IN_PROGRESS)          VARIANCE_REVIEW)
```

---

### InventoryCountLine

Individual line item within an inventory count.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| countId | UUID | FK → InventoryCount | Parent count |
| profileId | UUID | FK → AluminumProfile | Counted profile |
| locationId | UUID | FK → StorageLocation | Specific location |
| lotId | UUID | FK → Lot | Lot reference (nullable) |
| systemQuantity | DECIMAL(10,3) | NOT NULL | System stock at count start |
| countedQuantity | DECIMAL(10,3) | NULL | Physical count (NULL = not counted) |
| variance | DECIMAL(10,3) | COMPUTED | counted - system |
| variancePercentage | DECIMAL(5,2) | COMPUTED | (variance / system) * 100 |
| countStatus | ENUM | DEFAULT 'PENDING' | PENDING, COUNTED, RECOUNT_REQUESTED |
| reasonCode | ENUM | NULL | COUNT_ERROR, THEFT, DAMAGE, SYSTEM_ERROR, OTHER |
| notes | TEXT | NULL | Explanation for variance |
| countedBy | UUID | FK → User | User who performed count |
| countedAt | TIMESTAMP | NULL | When line was counted |
| isAdjusted | BOOLEAN | DEFAULT false | Whether variance was posted |
| adjustmentPostedAt | TIMESTAMP | NULL | When adjustment applied |

**Relationships**:
- Many-to-One: InventoryCountLine → InventoryCount
- Many-to-One: InventoryCountLine → AluminumProfile
- Many-to-One: InventoryCountLine → StorageLocation
- Many-to-One: InventoryCountLine → Lot (optional)
- Many-to-One: InventoryCountLine → User (countedBy)

**Validation Rules**:
- countedQuantity ≥ 0 (when provided)
- variance = countedQuantity - systemQuantity
- isAdjusted can only be true if status = ADJUSTMENT_APPROVED

---

### StockLayer

FIFO valuation layer - tracks each receipt batch for cost calculation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| profileId | UUID | FK → AluminumProfile | Related profile |
| lotId | UUID | FK → Lot | Related lot |
| warehouseId | UUID | FK → Warehouse | Warehouse location |
| receiptDate | TIMESTAMP | NOT NULL | When layer was received |
| originalQuantity | DECIMAL(10,3) | NOT NULL | Original receipt quantity |
| remainingQuantity | DECIMAL(10,3) | NOT NULL | Unconsumed quantity |
| unitCost | DECIMAL(12,4) | NOT NULL | Cost per unit |
| referenceType | VARCHAR(50) | NOT NULL | PURCHASE_ORDER, PRODUCTION, etc. |
| referenceId | VARCHAR(50) | NOT NULL | Document ID |
| isExhausted | BOOLEAN | DEFAULT false | True when remaining = 0 |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Relationships**:
- Many-to-One: StockLayer → AluminumProfile
- Many-to-One: StockLayer → Lot
- Many-to-One: StockLayer → Warehouse

**Validation Rules**:
- remainingQuantity ≥ 0
- remainingQuantity ≤ originalQuantity
- isExhausted = true when remainingQuantity = 0

**Indexes**:
- (profileId, warehouseId, receiptDate) - For FIFO consumption ordering
- (isExhausted, profileId) - For active layer queries

---

## State Machines

### InventoryCount Status

```
┌─────────┐    start()     ┌─────────────┐   submit()   ┌─────────────────┐
│  DRAFT  │───────────────▶│ IN_PROGRESS │─────────────▶│ VARIANCE_REVIEW │
└────┬────┘                └──────┬──────┘              └────────┬────────┘
     │                            │         ┌───────────────────┘
     │ cancel()                   │ back()  │ approve()
     ▼                            ▼         ▼
┌───────────┐               ┌─────────┐  ┌─────────────────────┐
│ CANCELLED │               │  DRAFT  │  │ ADJUSTMENT_APPROVED │
└───────────┘               └─────────┘  └──────────┬──────────┘
                                                    │ apply()
                                                    ▼
                                              ┌──────────┐
                                              │ COMPLETED│
                                              └──────────┘
```

### Lot Quality Status

```
┌─────────────┐
│  QUARANTINE │◀──── on receipt pending quality check
└──────┬──────┘
       │ quality check passed
       ▼
┌─────────────┐
│   APPROVED  │◀──── normal operational state
└──────┬──────┘
       │ quality issue detected
       ▼
┌─────────────┐
│   REJECTED  │◀──── quarantined for return/disposal
└─────────────┘
```

---

## Key Queries

### Current Stock Level by Profile
```sql
SELECT 
  profile_id,
  SUM(quantity_on_hand) as total_on_hand,
  SUM(quantity_reserved) as total_reserved,
  SUM(quantity_available) as total_available
FROM inventory_items
GROUP BY profile_id;
```

### FIFO Cost Calculation for Issue
```sql
-- Get layers in FIFO order
SELECT * FROM stock_layers 
WHERE profile_id = ? 
  AND warehouse_id = ?
  AND is_exhausted = false
ORDER BY receipt_date ASC;
```

### Lot Traceability Chain
```sql
WITH RECURSIVE traceability_chain AS (
  SELECT * FROM lot_traceability 
  WHERE lot_id = ? AND parent_traceability_id IS NULL
  
  UNION ALL
  
  SELECT lt.* 
  FROM lot_traceability lt
  JOIN traceability_chain tc ON lt.parent_traceability_id = tc.id
)
SELECT * FROM traceability_chain ORDER BY path;
```

### Stock Movement History
```sql
SELECT * FROM stock_movements 
WHERE profile_id = ? 
  AND warehouse_id = ?
  AND performed_at BETWEEN ? AND ?
ORDER BY performed_at DESC;
```

---

**Data Model Version**: 1.0.0 | **Last Updated**: 2026-03-04
