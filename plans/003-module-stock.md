# Feature Specification: Module B — Stock Avancé (Advanced Stock Management)

**Feature Branch**: `003-module-stock`  
**Created**: 2025-03-03  
**Status**: Draft  
**Input**: User description: "Multi-warehouse inventory management with automatic updates, alerts, stock movements tracking, rotation analysis, lot/traceability management for aluminum profiles"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Warehouse Management (Priority: P1)

As a warehouse manager, I want to manage inventory across multiple warehouses, so that I can track stock levels at each location.

**Why this priority**: Core functionality - aluminum companies often have multiple storage sites.

**Independent Test**: Can be tested by creating warehouses and transferring stock between them.

**Acceptance Scenarios**:

1. **Given** system has 3 warehouses defined, **When** viewing stock overview, **Then** each warehouse shows its total stock value and item count
2. **Given** warehouse "Main" has 100 units of profile X, **When** transferring 30 units to "Secondary", **Then** Main has 70, Secondary has 30
3. **Given** warehouse is closed, **When** deactivating warehouse, **Then** existing stock is reassigned but warehouse no longer appears in active lists

---

### User Story 2 - Automatic Stock Updates (Priority: P1)

As a system, I want to automatically update stock levels when production orders or deliveries are validated, so that inventory is always accurate.

**Why this priority**: Critical for inventory accuracy - manual updates are error-prone and time-consuming.

**Independent Test**: Can be tested by creating/completing production orders and verifying stock changes.

**Acceptance Scenarios**:

1. **Given** production order for 50 units is completed, **When** order is validated, **Then** stock of that profile increases by 50
2. **Given** delivery note for 20 units is validated, **When** delivery is confirmed, **Then** stock decreases by 20
3. **Given** multiple transactions happen same day, **When** viewing stock level, **Then** current balance reflects all transactions

---

### User Story 3 - Stock Alert Threshold (Priority: P1)

As a stock manager, I want to receive alerts when stock falls below minimum threshold, so that I can reorder before running out.

**Why this priority**: Prevents production stoppages due to material shortages.

**Independent Test**: Can be tested by setting threshold and simulating stock decrease.

**Acceptance Scenarios**:

1. **Given** profile X has current stock of 100 units, **When** setting minimum threshold to 150 units, **Then** alert is triggered immediately (100 < 150)
2. **Given** stock decreases to below threshold, **When** stock drops below minimum, **Then** email notification is sent to configured recipients
3. **Given** alert is triggered, **When** viewing dashboard, **Then** alert is visible with red indicator

---

### User Story 4 - Stock Movement History (Priority: P1)

As a warehouse supervisor, I want to view complete history of all stock movements, so that I can audit inventory and investigate discrepancies.

**Why this priority**: Required for compliance and inventory accuracy investigation.

**Independent Test**: Can be tested by performing various movements and verifying history.

**Acceptance Scenarios**:

1. **Given** 5 movements have occurred for profile X, **When** viewing history, **Then** all 5 are listed with date, type, quantity, user
2. **Given** need to find who performed a specific movement, **When** filtering by date range, **Then** only relevant movements are shown
3. **Given** inventory count differs from system, **When** recording inventory adjustment, **Then** adjustment is logged with reason

---

### User Story 5 - Stock Rotation Analysis (Priority: P2)

As a supply chain manager, I want to analyze stock rotation rates, so that I can identify slow-moving items and optimize inventory levels.

**Why this priority**: Helps reduce carrying costs and identify dead stock.

**Independent Test**: Can be tested by running rotation analysis on known data.

**Acceptance Scenarios**:

1. **Given** profile X: 100 units sold in last 90 days, average stock 50, **When** calculating rotation, **Then** result = 2.0 (100/50)
2. **Given** rotation analysis is run, **When** viewing results, **Then** items are sortable by rotation rate
3. **Given** item has rotation < 0.5 (very slow), **When** viewing, **Then** item is flagged as "slow-moving"

---

### User Story 6 - Lot and Traceability Management (Priority: P1)

As a quality manager, I want to track lots for each inventory item, so that I can trace materials back to suppliers and forward to customers.

**Why this priority**: Essential for quality control and recall management - aluminum has strict traceability requirements.

**Independent Test**: Can be tested by receiving items with lot numbers and tracing them through production/delivery.

**Acceptance Scenarios**:

1. **Given** receiving 500 units of profile X from supplier, **When** recording receipt, **Then** lot number is assigned with supplier, date, quantity
2. **Given** lot #L123 was used in production, **When** viewing lot history, **Then** shows receipt, usage in production, which orders it went to
3. **Given** quality issue discovered with lot #L123, **When** running traceability report, **Then** all affected orders/customers are identified

---

### User Story 7 - Stock Valuation (Priority: P2)

As a finance director, I want to know the total value of inventory, so that I can include it in financial statements and assess working capital.

**Why this priority**: Critical for financial reporting and business planning.

**Independent Test**: Can be tested by verifying total value calculation matches manual calculation.

**Acceptance Scenarios**:

1. **Given** 100 units at €10 each, 200 units at €12 each, **When** calculating total value, **Then** result = €3,400
2. **Given** stock valuation report is generated, **When** viewing by warehouse, **Then** each warehouse shows its portion of total value
3. **Given** FIFO method is used, **When** calculating value, **Then** oldest purchase prices are used first

---

### User Story 8 - Inventory Count (Priority: P2)

As a warehouse manager, I want to perform physical inventory counts, so that I can verify system records match actual stock.

**Why this priority**: Required for inventory accuracy verification.

**Independent Test**: Can be tested by performing inventory count and generating variance report.

**Acceptance Scenarios**:

1. **Given** inventory count is initiated, **When** user counts each item and enters quantities, **Then** variances are calculated
2. **Given** variance found (+10 units), **When** reviewing, **Then** user can approve adjustment to sync system with physical count
3. **Given** inventory count is completed, **When** viewing history, **Then** count date, user, and results are recorded

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support multiple warehouses with hierarchical location (site > zone > rack > aisle > level)
- **FR-002**: System MUST automatically update stock on: production completion (increase), delivery validation (decrease), transfer (move), inventory adjustment (increase/decrease)
- **FR-003**: System MUST support configurable alert thresholds per product
- **FR-004**: System MUST send email notifications when stock falls below threshold
- **FR-005**: System MUST display visual alerts on dashboard for low stock items
- **FR-006**: System MUST track all stock movements with: timestamp, type, quantity, reference document, user
- **FR-007**: System MUST calculate stock rotation rate: Rotation = Total Issues / Average Stock
- **FR-008**: System MUST support lot/traceability tracking: lot number, supplier, receipt date, certificate
- **FR-009**: System MUST calculate stock value using FIFO method
- **FR-010**: System MUST support inventory count workflow: initiate > count > variance > adjust > close
- **FR-011**: System MUST calculate stock coverage: Coverage = Available Stock / Average Daily Consumption

### Key Entities *(include if feature involves data)*

- **Warehouse**: id, name, code, address, is_active, created_at
- **Location**: id, warehouse_id, zone, rack, aisle, level, capacity, is_active
- **InventoryItem**: id, profile_id, warehouse_id, location_id, lot_number, quantity, unit_cost, last_updated
- **StockMovement**: id, profile_id, warehouse_id, location_id, movement_type, quantity, reference_type, reference_id, notes, user_id, timestamp
- **StockAlert**: id, profile_id, warehouse_id, threshold, is_active, created_at, acknowledged_at
- **InventoryCount**: id, warehouse_id, status, initiated_by, initiated_at, completed_at
- **InventoryCountLine**: id, inventory_count_id, profile_id, location_id, counted_quantity, system_quantity, variance

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Stock updates reflect in system within 2 seconds of transaction completion
- **SC-002**: Low stock alerts are triggered and sent within 5 minutes of threshold breach
- **SC-003**: Stock movement history is queryable and loads within 3 seconds for 10,000 records
- **SC-004**: Stock value calculation matches accounting records within 0.1% accuracy
- **SC-005**: Lot traceability can trace any item to source supplier within 2 clicks

---

## Dependencies

- Requires: 001-auth-security (for user authentication and roles)
- Requires: 002-module-aluminium (for profile definitions and pricing)
- Required by: 008-bi-dashboard (for stock KPIs), 009-ai-module (for stock optimization)
