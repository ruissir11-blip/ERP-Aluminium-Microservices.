# Feature Specification: Module B — Stock Avancé (Advanced Stock Management)

**Feature Branch**: `003-module-stock`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Multi-warehouse inventory management with automatic updates, alerts, stock movements tracking, rotation analysis, lot/traceability management for aluminum profiles"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Warehouse Management (Priority: P1)

As a warehouse manager, I want to manage inventory across multiple warehouses, so that I can track stock levels at each location.

**Why this priority**: Core functionality - aluminum companies often have multiple storage sites and need visibility across all locations.

**Independent Test**: Can be tested by creating warehouses and transferring stock between them independently of other features.

**Acceptance Scenarios**:

1. **Given** system has 3 warehouses defined (North, South, Central), **When** viewing stock overview, **Then** each warehouse shows its total stock value and item count
2. **Given** warehouse "Main" has 100 units of profile X, **When** transferring 30 units to "Secondary", **Then** Main shows 70 units and Secondary shows 30 units
3. **Given** warehouse is closed, **When** deactivating warehouse, **Then** existing stock is reassigned to another active warehouse and the closed warehouse no longer appears in active selection lists

---

### User Story 2 - Automatic Stock Updates (Priority: P1)

As a system, I want to automatically update stock levels when production orders or deliveries are validated, so that inventory is always accurate without manual intervention.

**Why this priority**: Critical for inventory accuracy - manual updates are error-prone, time-consuming, and can lead to production stoppages.

**Independent Test**: Can be tested by creating/completing production orders and verifying stock changes without requiring other modules to be fully implemented.

**Acceptance Scenarios**:

1. **Given** production order for 50 units of profile X is completed, **When** order is validated, **Then** stock of that profile increases by 50 units within 2 seconds
2. **Given** delivery note for 20 units is validated, **When** delivery is confirmed, **Then** stock decreases by 20 units immediately
3. **Given** multiple transactions happen on the same day, **When** viewing current stock level, **Then** the balance reflects all completed transactions in chronological order

---

### User Story 3 - Stock Alert Threshold (Priority: P1)

As a stock manager, I want to receive alerts when stock falls below minimum threshold, so that I can reorder materials before running out and avoid production stoppages.

**Why this priority**: Prevents production stoppages due to material shortages which can cost thousands of euros per hour in lost productivity.

**Independent Test**: Can be tested by setting threshold and simulating stock decrease without requiring integration with supplier systems.

**Acceptance Scenarios**:

1. **Given** profile X has current stock of 100 units, **When** setting minimum threshold to 150 units, **Then** alert is triggered immediately with visual indicator
2. **Given** stock decreases to below threshold during normal operations, **When** stock drops below minimum, **Then** email notification is sent to configured recipients within 5 minutes
3. **Given** alert is triggered, **When** viewing dashboard, **Then** alert is visible with red indicator showing current stock vs threshold

---

### User Story 4 - Stock Movement History (Priority: P1)

As a warehouse supervisor, I want to view complete history of all stock movements, so that I can audit inventory and investigate discrepancies for compliance purposes.

**Why this priority**: Required for regulatory compliance, inventory accuracy investigation, and financial auditing.

**Independent Test**: Can be tested by performing various movements and verifying history is correctly recorded.

**Acceptance Scenarios**:

1. **Given** 5 movements have occurred for profile X over the past month, **When** viewing movement history, **Then** all 5 are listed with timestamp, movement type, quantity, user, and reference document
2. **Given** need to find who performed a specific movement on a particular date, **When** filtering by date range and profile, **Then** only relevant movements are shown within 3 seconds
3. **Given** physical inventory count differs from system count, **When** recording inventory adjustment with reason, **Then** adjustment is logged as a movement with type "Adjustment" and reason noted

---

### User Story 5 - Lot and Traceability Management (Priority: P1)

As a quality manager, I want to track lots for each inventory item, so that I can trace materials back to suppliers and forward to customers for quality control and recall management.

**Why this priority**: Essential for quality control and recall management - aluminum has strict industry traceability requirements.

**Independent Test**: Can be tested by receiving items with lot numbers and tracing them without requiring production module integration.

**Acceptance Scenarios**:

1. **Given** receiving 500 units of profile X from supplier ABC, **When** recording receipt with lot number L-2024-001, **Then** lot is assigned with supplier info, receipt date, quantity, and certificate reference
2. **Given** lot L-2024-001 was used in production of order ORD-123, **When** viewing lot history, **Then** traceability chain shows receipt → production usage → customer order
3. **Given** quality issue discovered with lot L-2024-001, **When** running traceability report, **Then** all affected orders and customers are identified within 30 seconds

---

### User Story 6 - Stock Rotation Analysis (Priority: P2)

As a supply chain manager, I want to analyze stock rotation rates, so that I can identify slow-moving items and optimize inventory levels to reduce carrying costs.

**Why this priority**: Helps reduce carrying costs, identify dead stock, and optimize warehouse space utilization.

**Independent Test**: Can be tested by running rotation analysis on known historical data.

**Acceptance Scenarios**:

1. **Given** profile X: 100 units issued in last 90 days, average stock 50 units, **When** calculating rotation rate, **Then** result equals 2.0 (100 ÷ 50)
2. **Given** rotation analysis is run across all profiles, **When** viewing results, **Then** items are sortable by rotation rate with color coding (fast/medium/slow)
3. **Given** item has rotation rate below 0.5 over 6 months, **When** viewing analysis, **Then** item is flagged as "slow-moving" with recommendation to review stock levels

---

### User Story 7 - Stock Valuation (Priority: P2)

As a finance director, I want to know the total value of inventory, so that I can include it in financial statements and assess working capital requirements.

**Why this priority**: Critical for financial reporting, balance sheets, and business planning decisions.

**Independent Test**: Can be tested by verifying total value calculation matches manual calculation from purchase records.

**Acceptance Scenarios**:

1. **Given** 100 units at €10 each from oldest purchase, 200 units at €12 each from newer purchase, **When** calculating total value using FIFO, **Then** result equals €3,400
2. **Given** stock valuation report is generated, **When** viewing breakdown by warehouse, **Then** each warehouse shows its portion of total value with percentage
3. **Given** FIFO method is configured, **When** calculating cost of goods issued, **Then** oldest purchase prices are used first for cost assignment

---

### User Story 8 - Inventory Count (Priority: P2)

As a warehouse manager, I want to perform physical inventory counts, so that I can verify system records match actual stock and maintain inventory accuracy.

**Why this priority**: Required for inventory accuracy verification and year-end financial audits.

**Independent Test**: Can be tested by performing inventory count and generating variance report without affecting live stock until approved.

**Acceptance Scenarios**:

1. **Given** inventory count is initiated for warehouse "Main", **When** user counts each item and enters physical quantities, **Then** variances are calculated showing difference from system count
2. **Given** variance found of +10 units for profile X, **When** supervisor reviews and approves adjustment, **Then** system stock is updated and adjustment is logged as movement
3. **Given** inventory count is completed, **When** viewing count history, **Then** count date, user, variances found, and adjustments made are all recorded

---

### Edge Cases

- **What happens when** a stock transfer is initiated but the destination warehouse becomes inactive before completion?
  - System must hold the transfer in "pending" status and alert administrators
  
- **How does system handle** simultaneous stock updates from production completion and manual adjustment?
  - System must use optimistic locking to prevent race conditions and maintain data integrity
  
- **What happens when** a lot number is scanned but does not exist in the system?
  - System must reject the transaction and prompt user to verify lot number or create new lot record
  
- **How does system handle** negative stock situations when strict control is enabled?
  - System must block transactions that would result in negative stock and display clear error message
  
- **What happens when** an alert threshold is set higher than maximum stock capacity?
  - System must warn user of configuration conflict and suggest appropriate threshold

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support multiple warehouses with hierarchical location structure: site → zone → rack → aisle → level
- **FR-002**: System MUST automatically update stock on: production completion (increase), delivery validation (decrease), transfer between warehouses (move), inventory adjustment (increase/decrease)
- **FR-003**: System MUST support configurable alert thresholds per product with minimum and maximum levels
- **FR-004**: System MUST send email notifications when stock falls below minimum threshold or exceeds maximum capacity
- **FR-005**: System MUST display visual alerts on dashboard for low stock items with color coding (green/adequate, orange/low, red/critical)
- **FR-006**: System MUST track all stock movements with: timestamp, movement type, quantity, source location, destination location, reference document, user who performed action
- **FR-007**: System MUST calculate stock rotation rate using formula: Rotation = Total Issues ÷ Average Stock over period
- **FR-008**: System MUST calculate stock coverage days using formula: Coverage = Available Stock ÷ Average Daily Consumption
- **FR-009**: System MUST support lot/traceability tracking with: lot number, supplier, receipt date, certificate of conformity, expiry date if applicable
- **FR-010**: System MUST calculate stock value using FIFO (First In, First Out) method by default with support for weighted average as alternative
- **FR-011**: System MUST support inventory count workflow: initiate → count → variance analysis → approval → adjustment → close
- **FR-012**: System MUST allow stock transfers between warehouses with tracking of goods in transit
- **FR-013**: System MUST support partial receipts where delivered quantity may differ from ordered quantity
- **FR-014**: System MUST provide stock search and filtering by: profile, warehouse, location, lot number, date range

### Key Entities *(include if feature involves data)*

- **Warehouse**: Represents a physical storage location (site, building, or external storage). Attributes: identifier, name, code, address, contact person, is active flag, created date.
- **StorageLocation**: Represents a specific bin/rack/position within a warehouse. Attributes: identifier, warehouse reference, zone, rack, aisle, level, maximum capacity, is active flag.
- **InventoryItem**: Represents stock of a specific profile at a specific location. Attributes: identifier, profile reference, warehouse reference, location reference, lot number, quantity on hand, reserved quantity, unit cost, last movement date.
- **StockMovement**: Records every change to inventory quantities. Attributes: identifier, profile reference, warehouse reference, location reference, movement type (receipt, issue, transfer, adjustment), quantity, reference document type and ID, notes, user identifier, timestamp.
- **StockAlert**: Defines alert thresholds for a product. Attributes: identifier, profile reference, warehouse reference, minimum threshold, maximum threshold, reorder point, alert recipients, is active flag.
- **Lot**: Represents a batch of material from a supplier with traceability info. Attributes: identifier, lot number, profile reference, supplier, receipt date, quantity received, quantity remaining, certificate reference, expiry date.
- **InventoryCount**: Represents a physical stocktaking session. Attributes: identifier, warehouse reference, status (draft, in progress, completed, cancelled), initiated by user, initiated date, completed date.
- **InventoryCountLine**: Individual line item within an inventory count. Attributes: identifier, count session reference, profile reference, location reference, system quantity, counted quantity, variance, reason code, is adjusted flag.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Stock updates reflect in system within 2 seconds of transaction completion
- **SC-002**: Low stock alerts are triggered and notifications sent within 5 minutes of threshold breach
- **SC-003**: Stock movement history is queryable and loads within 3 seconds for up to 10,000 records
- **SC-004**: Stock value calculation matches accounting records within 0.1% accuracy when using same cost method
- **SC-005**: Lot traceability report can identify all affected orders and customers within 30 seconds for any given lot
- **SC-006**: Inventory count variance report generates within 10 seconds for warehouses with up to 1,000 SKUs
- **SC-007**: Stock accuracy (physical vs system) improves to 98% or higher after regular inventory counts
- **SC-008**: Users can complete stock transfer workflow in under 2 minutes for standard scenarios

---

## Assumptions

- Integration with production module will trigger automatic stock receipts when production orders are completed
- Integration with sales/delivery module will trigger automatic stock issues when delivery notes are validated
- Users will have appropriate warehouse management training to perform inventory counts accurately
- Barcode or RFID scanning equipment may be used but manual entry is also supported
- Network connectivity is reliable within warehouse environments for real-time updates

---

## Dependencies

- **Requires**: 001-auth-security (for user authentication and role-based access control)
- **Requires**: 002-module-aluminium (for profile definitions and unit pricing information)
- **Required by**: 008-bi-dashboard (for stock KPIs and analytics), 009-ai-module (for stock optimization and demand forecasting)
