# Feature Specification: Module D — Contrôle Qualité (Quality Control)

**Feature Branch**: `005-module-qualite`  
**Created**: 2025-03-03  
**Status**: Draft  
**Input**: User description: "Quality control management including inspection points, quality checks, non-conformity tracking (NC), root cause analysis, corrective actions, quality statistics and reporting for aluminum production"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quality Inspection Points (Priority: P1)

As a quality manager, I want to define inspection points in the production process, so that products are checked at critical stages.

**Why this priority**: Ensures quality at key stages - prevents defects from propagating.

**Independent Test**: Can be tested by defining inspection points and verifying they appear in production workflow.

**Acceptance Scenarios**:

1. **Given** production has 3 stages: cutting, assembly, finishing, **When** creating inspection points for each stage, **Then** each point appears in quality checklist during production
2. **Given** inspection point requires specific measurements, **When** configuring, **Then** tolerance ranges can be defined for each measurement
3. **Given** production order reaches inspection stage, **When** operator opens quality check, **Then** all configured inspection criteria are displayed

---

### User Story 2 - Quality Inspection Execution (Priority: P1)

As a quality controller, I want to perform quality inspections during production, so that I can verify products meet specifications.

**Why this priority**: Core quality function - captures actual quality data.

**Independent Test**: Can be tested by performing inspection and verifying results are recorded.

**Acceptance Scenarios**:

1. **Given** inspection point for "surface finish", **When** controller checks and enters results, **Then** values are saved with timestamp and controller identity
2. **Given** measured value is 9.5mm, tolerance is 10.0mm ±0.5mm, **When** entering measurement, **Then** system shows "Conforme" (within tolerance)
3. **Given** measured value is 9.0mm (outside tolerance), **When** entering, **Then** system marks as "Non-Conforme" and flags for review

---

### User Story 3 - Non-Conformity Reporting (Priority: P1)

As a quality controller, I want to report non-conformities when defects are found, so that they can be tracked and resolved.

**Why this priority**: Captures quality issues for analysis and resolution.

**Independent Test**: Can be tested by creating non-conformity reports.

**Acceptance Scenarios**:

1. **Given** defect is found during inspection, **When** creating NC report with description, lot number, photos, **Then** NC is created with status "Ouverte"
2. **Given** NC is created, **When** viewing NC list, **Then** all NCs are visible with status, severity, date
3. **Given** NC needs immediate attention, **When** setting priority to "Critique", **Then** NC appears prominently in dashboard

---

### User Story 4 - Root Cause Analysis (Priority: P1)

As a quality engineer, I want to perform root cause analysis on non-conformities, so that I can identify and address underlying causes.

**Why this priority**: Prevents recurrence - addresses root cause not symptoms.

**Independent Test**: Can be tested by performing root cause analysis on NCs.

**Acceptance Scenarios**:

1. **Given** NC is reported for surface scratch, **When** using "5 Pourquoi" method, **Then** analysis steps are recorded with each "pourquoi" response
2. **Given** NC is analyzed using Ishikawa diagram, **When** categorizing causes, **Then** causes can be assigned to categories: Machine, Method, Material, Man, Environment
3. **Given** root cause is identified, **When** saving analysis, **Then** cause is linked to NC record

---

### User Story 5 - Corrective and Preventive Actions (Priority: P1)

As a quality manager, I want to define and track corrective actions for non-conformities, so that issues are resolved and prevented from recurring.

**Why this priority**: Closes the quality loop - ensures problems are fixed.

**Independent Test**: Can be tested by creating and tracking corrective actions.

**Acceptance Scenarios**:

1. **Given** NC root cause is "machine calibration", **When** creating corrective action "Recalibrate machine", **Then** action has due date and assigned owner
2. **Given** corrective action is completed, **When** marking as "Terminée", **Then** completion date is recorded
3. **Given** corrective action effectiveness needs verification, **When** performing follow-up, **Then** results are recorded and NC can be closed

---

### User Story 6 - Quality Decision for Non-Conformities (Priority: P1)

As a quality manager, I want to make decisions on how to handle non-conform products, so that they are processed according to defined procedures.

**Why this priority**: Determines product fate - rework, use-as-is, or scrap.

**Independent Test**: Can be tested by making quality decisions and verifying product handling.

**Acceptance Scenarios**:

1. **Given** NC is analyzed, **When** deciding "À retravailler", **Then** product is sent back for rework with NC reference
2. **Given** defect is minor and acceptance is possible, **When** deciding "Dérogation" (use-as-is), **Then** approval chain is triggered (requires manager approval)
3. **Given** defect is unrecoverable, **When** deciding "Rebut", **Then** product is scrapped with quantity recorded

---

### User Story 7 - Quality Statistics and Pareto Analysis (Priority: P2)

As a quality director, I want to view quality statistics and Pareto charts, so that I can identify the most common defects and prioritize improvement efforts.

**Why this priority**: Data-driven quality management - focuses efforts on biggest problems.

**Independent Test**: Can be tested by generating statistics and verifying Pareto chart.

**Acceptance Scenarios**:

1. **Given** 100 NCs recorded over 6 months, **When** generating Pareto, **Then** defects are sorted by frequency with cumulative line
2. **Given** Pareto shows "surface scratch" is 40% of all defects, **When** viewing, **Then** this defect is highlighted as priority
3. **Given** filtering by machine, **When** comparing, **Then** Pareto shows defect distribution per machine

---

### User Story 8 - Quality Reports Generation (Priority: P2)

As a quality manager, I want to generate periodic quality reports, so that management has visibility into quality performance.

**Why this priority**: Communication tool for quality metrics - required for management reviews.

**Independent Test**: Can be tested by generating reports and verifying content.

**Acceptance Scenarios**:

1. **Given** weekly quality report is configured, **When** report runs, **Then** PDF includes: NC count, closure rate, top defects, trends
2. **Given** customer requires certificate of conformity, **When** order is shipped, **Then** certificate is auto-generated with order details, inspection results
3. **Given** report is ready, **When** scheduling, **Then** email is sent to configured recipients automatically

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow configuration of inspection points per production stage
- **FR-002**: System MUST support inspection criteria with nominal values and tolerance ranges
- **FR-003**: System MUST allow entry of measured values and auto-determine conformance status
- **FR-004**: System MUST support digital signature by quality controller
- **FR-005**: System MUST create NC records with: description, lot number, photos, severity, date, reporter
- **FR-006**: System MUST support NC severity levels: critique, majeur, mineur
- **FR-007**: System MUST support root cause analysis methods: 5 Pourquoi, Ishikawa
- **FR-008**: System MUST track NC lifecycle: Détection → Analyse → Traitement → Clôture
- **FR-009**: System MUST support quality decisions: Conforme, Non-conforme, À retravailler, Rebut, Dérogation
- **FR-010**: System MUST calculate NC rate: NC Count / Total Inspections × 100
- **FR-011**: System MUST generate Pareto charts of defects by type, machine, operator
- **FR-012**: System MUST auto-generate certificates of conformity for shipped orders
- **FR-013**: System MUST support scheduled quality reports (weekly, monthly) with email distribution

### Key Entities *(include if feature involves data)*

- **InspectionPoint**: id, production_stage, name, description, criteria_json, is_mandatory
- **InspectionCriteria**: id, inspection_point_id, parameter_name, nominal_value, tolerance_min, tolerance_max, unit
- **InspectionRecord**: id, production_order_id, inspection_point_id, inspector_id, status, result, measured_values_json, signed_at
- **NonConformity**: id, nc_number, production_order_id, lot_number, description, severity, status, detected_by, detected_at, closed_at
- **NCRootCause**: id, nc_id, method, analysis_json, identified_cause, category
- **CorrectiveAction**: id, nc_id, description, assigned_to, due_date, status, completed_at, effectiveness_verification
- **QualityDecision**: id, nc_id, decision_type, approved_by, approved_at, notes

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quality inspections are completed within production workflow without delays
- **SC-002**: NCs are acknowledged within 24 hours of detection
- **SC-003**: Root cause analysis is completed for 100% of critical NCs
- **SC-004**: Quality statistics are accurate and available in real-time
- **SC-005**: Certificates of conformity are generated automatically for 100% of shipped orders

---

## Dependencies

- Requires: 001-auth-security (for user authentication and roles)
- Requires: 002-module-aluminium (for production orders)
- Required by: 008-bi-dashboard (for quality KPIs)
