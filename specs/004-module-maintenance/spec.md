# Feature Specification: Module C — Maintenance Industrielle (Industrial Maintenance)

**Feature Branch**: `004-module-maintenance`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "Industrial maintenance management including machine fleet, preventive maintenance scheduling, corrective maintenance (breakdown), work orders, spare parts management, and maintenance KPIs (TRS, MTBF, MTTR)"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Machine Fleet Management (Priority: P1)

As a maintenance manager, I want to maintain a complete inventory of all production machines, so that I can track equipment history and plan maintenance.

**Why this priority**: Foundation for all maintenance activities - you can't maintain what you don't track.

**Independent Test**: Can be tested by creating, viewing, and managing machine records.

**Acceptance Scenarios**:

1. **Given** new machine is acquired, **When** creating machine record with all details, **Then** machine appears in fleet list
2. **Given** machine record includes serial number, purchase date, value, **When** viewing machine details, **Then** all information is displayed including depreciation
3. **Given** machine is permanently removed, **When** archiving machine, **Then** machine is hidden from active list but data preserved

---

### User Story 2 - Preventive Maintenance Scheduling (Priority: P1)

As a maintenance technician, I want to schedule preventive maintenance tasks on a calendar, so that machines receive regular servicing to prevent breakdowns.

**Why this priority**: Prevents unplanned downtime and extends machine life - critical for continuous production.

**Independent Test**: Can be tested by creating preventive maintenance plans and verifying calendar entries.

**Acceptance Scenarios**:

1. **Given** machine requires oil change every 3 months, **When** creating preventive plan with quarterly frequency, **Then** work orders are auto-generated each quarter
2. **Given** preventive work order is due tomorrow, **When** viewing maintenance calendar, **Then** task is highlighted as upcoming
3. **Given** preventive maintenance is completed, **When** closing work order, **Then** next occurrence is auto-scheduled

---

### User Story 3 - Corrective Maintenance / Breakdown Management (Priority: P1)

As a machine operator, I want to report machine breakdowns immediately, so that maintenance can respond quickly to minimize downtime.

**Why this priority**: Minimizes production loss - every minute of downtime costs money.

**Independent Test**: Can be tested by reporting a breakdown and tracking resolution.

**Acceptance Scenarios**:

1. **Given** machine stops during production, **When** operator reports breakdown with severity "critical", **Then** alert is sent to maintenance team immediately
2. **Given** breakdown is reported, **When** technician starts work, **Then** response time is logged
3. **Given** repair is completed, **When** technician closes work order, **Then** resolution time is calculated and recorded

---

### User Story 4 - Work Order Management (Priority: P1)

As a maintenance supervisor, I want to manage work orders for all maintenance activities, so that I can track what needs to be done, who will do it, and when it's complete.

**Why this priority**: Core of maintenance operations - organizes all maintenance work.

**Independent Test**: Can be tested by creating and managing work orders through their lifecycle.

**Acceptance Scenarios**:

1. **Given** maintenance need is identified, **When** creating work order with description, priority, assigned technician, **Then** work order appears in queue
2. **Given** technician starts work, **When** updating status to "In Progress", **Then** start time is logged
3. **Given** work is complete, **When** closing work order, **Then** end time, parts used, and notes are recorded
4. **Given** work order requires spare parts, **When** selecting parts from inventory, **Then** parts are automatically deducted from stock

---

### User Story 5 - Spare Parts Management (Priority: P2)

As a maintenance technician, I want to use spare parts from inventory for repairs, so that parts are tracked and stock is updated automatically.

**Why this priority**: Ensures parts are tracked and reordered when low - prevents future delays.

**Independent Test**: Can be tested by using parts in work orders and verifying stock updates.

**Acceptance Scenarios**:

1. **Given** work order requires 2 bearings, **When** selecting bearings from inventory, **Then** 2 units are deducted from stock
2. **Given** part quantity reaches reorder point, **When** stock decreases, **Then** alert is triggered for purchasing
3. **Given** part is not in stock, **When** creating work order, **Then** work order can be flagged as "waiting for parts"

---

### User Story 6 - TRS (Taux de Rendement Synthétique) Calculation (Priority: P1)

As a production director, I want to know the overall equipment effectiveness (TRS) for each machine, so that I can identify improvement opportunities.

**Why this priority**: Key metric for production efficiency - reveals hidden capacity.

**Independent Test**: Can be tested by inputting production data and verifying TRS calculation.

**Acceptance Scenarios**:

1. **Given** machine: available time 8h, downtime 1h, output 1000 units (target 1200), **When** calculating TRS, **Then** TRS = (7/8) × (1000/1200) = 72.9%
2. **Given** TRS dashboard, **When** viewing, **Then** each machine shows its TRS with color coding (green >80%, yellow 60-80%, red <60%)
3. **Given** TRS is below target, **When** drilling down, **Then** breakdown shows availability, performance, quality components

---

### User Story 7 - MTBF / MTTR Analysis (Priority: P2)

As a maintenance manager, I want to track MTBF (mean time between failures) and MTTR (mean time to repair), so that I can measure maintenance effectiveness.

**Why this priority**: Indicates maintenance strategy effectiveness - guides improvement efforts.

**Independent Test**: Can be tested by recording breakdowns and verifying metrics.

**Acceptance Scenarios**:

1. **Given** machine had 3 breakdowns: 24h apart, 48h apart, 72h apart, **When** calculating MTBF, **Then** MTBF = (24+48+72)/3 = 48 hours
2. **Given** repairs took 2h, 3h, 1h, **When** calculating MTTR, **Then** MTTR = (2+3+1)/3 = 2 hours
3. **Given** MTBF is decreasing over time, **When** viewing trend, **Then** alert indicates machine is deteriorating faster

---

### User Story 8 - Maintenance Cost Tracking (Priority: P2)

As a finance manager, I want to track total maintenance costs per machine, so that I can evaluate equipment ROI and plan replacements.

**Why this priority**: Links maintenance to financial performance - helps justify capital investments.

**Independent Test**: Can be tested by recording costs and generating reports.

**Acceptance Scenarios**:

1. **Given** work order used €200 in parts + 4h labor at €50/h, **When** closing work order, **Then** total cost = €400 recorded
2. **Given** viewing cost report for machine X over year, **When** calculating, **Then** shows total maintenance cost, cost per operating hour, trend

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store machine records: designation, brand, model, serial number, purchase date, acquisition value, residual value, location/workshop
- **FR-002**: System MUST support machine documentation: upload manuals, schematics, maintenance guides
- **FR-003**: System MUST create preventive maintenance plans with configurable frequencies: daily, weekly, monthly, quarterly, annually
- **FR-004**: System MUST auto-generate work orders based on preventive maintenance schedules
- **FR-005**: System MUST support breakdown reporting with severity levels: critique, majeure, mineure
- **FR-006**: System MUST track work order lifecycle: Créé → Assigné → En cours → Terminé → Clôturé
- **FR-007**: System MUST integrate with stock module for spare parts deduction
- **FR-008**: System MUST calculate TRS = Availability × Performance × Quality
  - Availability = Operating Time / Planned Production Time
  - Performance = (Ideal Cycle Time × Total Pieces) / Operating Time
  - Quality = Good Pieces / Total Pieces
- **FR-009**: System MUST calculate MTBF = Total Operating Time / Number of Breakdowns
- **FR-010**: System MUST calculate MTTR = Total Repair Time / Number of Repairs
- **FR-011**: System MUST track maintenance costs: labor hours × rate + parts cost
- **FR-012**: System MUST generate maintenance calendar view with color-coded tasks
- **FR-013**: System MUST calculate preventive vs corrective maintenance ratio

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Work orders are created automatically based on preventive schedules
- **SC-002**: Breakdowns are reported and acknowledged within 5 minutes (system records timestamp)
- **SC-003**: TRS is calculated and displayed for each machine in real-time
- **SC-004**: MTBF and MTTR metrics are available per machine with historical trends
- **SC-005**: Maintenance costs are accurately tracked and reportable per machine/period

---

## Dependencies

- Requires: 001-auth-security (for user authentication and roles)
- Requires: 003-module-stock (for spare parts management)
- Required by: 008-bi-dashboard (for maintenance KPIs)

---

## Assumptions

1. Labor rate for cost calculation is configurable at system level (default €50/hour)
2. Machines are located in predefined workshops/areas
3. Breakdown severity levels map to response time targets: critique (immediate), majeure (4h), mineure (24h)
4. TRS calculation uses standard 8-hour shift as default planned production time
5. Work order numbering follows format: "WO-YYYYMMDD-XXXX"
