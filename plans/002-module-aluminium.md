# Feature Specification: Module A — Métier Aluminium (Aluminum Business Module)

**Feature Branch**: `002-module-aluminium`  
**Created**: 2025-03-03  
**Status**: Draft  
**Input**: User description: "Core aluminum business module for profile management, automatic calculations (surface, weight, cost, margin), quote generation, order workflow, and production tracking for the aluminum transformation industry"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aluminum Profile Management (Priority: P1)

As a product manager, I want to manage the aluminum profile catalog, so that all products are properly defined with their technical specifications and pricing.

**Why this priority**: Core functionality - all sales, production, and inventory depend on accurate profile data.

**Independent Test**: Can be tested by creating, viewing, editing, and deactivating profiles independently.

**Acceptance Scenarios**:

1. **Given** user navigates to profile management, **When** creating new profile with all required fields, **Then** profile is saved and appears in catalog
2. **Given** profile exists with weight=5kg/m, length=6000mm, **When** viewing profile details, **Then** all attributes are displayed correctly
3. **Given** profile is no longer sold, **When** admin deactivates profile, **Then** profile is hidden from new quotes but remains in historical data

---

### User Story 2 - Automatic Surface Calculation (Priority: P1)

As a sales representative, I want the system to automatically calculate the surface area of aluminum profiles, so that I don't have to do manual calculations.

**Why this priority**: Reduces errors and speeds up quote creation - critical for daily sales operations.

**Independent Test**: Can be tested by entering various dimensions and verifying calculated surface matches expected formula.

**Acceptance Scenarios**:

1. **Given** profile type "plat" with length=3000mm, width=50mm, **When** system calculates surface, **Then** result = 0.15 m² (3m × 0.05m)
2. **Given** profile type "tube" with length=6000mm, width=40mm, **When** system calculates surface, **Then** formula accounts for tubular shape correctly
3. **Given** dimensions entered are invalid (negative or zero), **When** calculating, **Then** error message is displayed

---

### User Story 3 - Automatic Weight Calculation (Priority: P1)

As a sales representative, I want the system to automatically calculate the weight of aluminum profiles, so that I can determine shipping costs and material requirements.

**Why this priority**: Weight directly affects shipping costs and material planning - essential for accurate pricing.

**Independent Test**: Can be tested with known dimensions and aluminum density (2.70 g/cm³).

**Acceptance Scenarios**:

1. **Given** profile dimensions 100mm × 10mm × 6000mm (flat bar), **When** system calculates weight, **Then** result = 16.2 kg (using volume × 2.70 g/cm³)
2. **Given** profile has manually entered weight of 5.5 kg/m, **When** entering 3m length, **Then** total weight = 16.5 kg
3. **Given** length is updated in quote, **When** recalculating, **Then** weight updates automatically

---

### User Story 4 - Automatic Cost and Margin Calculation (Priority: P1)

As a commercial director, I want the system to automatically calculate material cost and profit margin, so that I can ensure profitability on every quote.

**Why this priority**: Margin calculation is critical for business profitability - must be accurate and auditable.

**Independent Test**: Can be tested with known costs and margin percentages.

**Acceptance Scenarios**:

1. **Given** profile weight=10kg, unit price=€3/kg, **When** calculating material cost, **Then** result = €30
2. **Given** material cost=€30, desired margin=20%, **When** calculating selling price, **Then** result = €37.50
3. **Given** discount of 10% applied, **When** recalculating, **Then** discount is applied to selling price (not cost)
4. **Given** user sets margin target in %, **When** creating quote, **Then** system calculates required selling price automatically

---

### User Story 5 - Quote Generation and Management (Priority: P1)

As a sales representative, I want to generate professional quotes from profile selections, so that I can quickly respond to customer requests.

**Why this priority**: Primary revenue-generating function - must be fast and professional-looking.

**Independent Test**: Can be tested by creating a complete quote and generating PDF.

**Acceptance Scenarios**:

1. **Given** customer requests quote for 3 different profiles, **When** adding all profiles to quote, **Then** each line shows description, dimensions, quantity, unit price, total
2. **Given** quote is created with total of €1000, **When** applying 5% global discount, **Then** discounted total = €950
3. **Given** quote is complete, **When** generating PDF, **Then** PDF includes company header, customer details, line items, totals, validity date
4. **Given** quote is sent to customer, **When** customer accepts, **Then** quote can be converted to order with one click

---

### User Story 6 - Quote-to-Order Workflow (Priority: P1)

As a sales manager, I want to track quotes through their lifecycle, so that I can monitor conversion rates and follow up effectively.

**Why this priority**: Sales pipeline visibility is critical for revenue forecasting and management.

**Independent Test**: Can be tested by moving a quote through all workflow stages.

**Acceptance Scenarios**:

1. **Given** quote in "Envoyé" status, **When** customer accepts verbally, **When** changing status to "Accepté", **Then** system prompts to create order
2. **Given** order is created from quote, **When** viewing order details, **Then** all quote information is carried over
3. **Given** order is confirmed by customer, **When** changing status to "Confirmée", **Then** system triggers production planning

---

### User Story 7 - Production Order Management (Priority: P2)

As a production manager, I want to manage production orders derived from customer orders, so that manufacturing is properly planned and tracked.

**Why this priority**: Connects sales to production - essential for fulfillment tracking.

**Independent Test**: Can be tested by creating and tracking production orders.

**Acceptance Scenarios**:

1. **Given** confirmed order exists, **When** creating production order, **Then** production order includes required profiles, quantities, delivery date
2. **Given** production order is "Planifié", **When** production starts, **When** changing status to "En cours", **Then** start time is logged
3. **Given** production is complete, **When** marking as "Terminé", **Then** finished quantities are recorded and inventory is updated

---

### User Story 8 - Delivery and Invoicing (Priority: P2)

As an operations manager, I want to generate delivery notes and invoices from orders, so that customers receive proper documentation.

**Why this priority**: Completes the order-to-cash cycle - essential for revenue recognition.

**Independent Test**: Can be tested by generating delivery notes and invoices.

**Acceptance Scenarios**:

1. **Given** order is ready for shipment, **When** generating delivery note, **Then** PDF includes customer info, items, quantities, date, driver signature field
2. **Given** delivery is confirmed, **When** generating invoice, **Then** invoice is created with sequential number, payment terms, bank details
3. **Given** customer payment is received, **When** marking invoice as "Payée", **Then** order is fully closed

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support aluminum profile types: cornière, tube, plat, UPN, IPE, et others (extensible list)
- **FR-002**: System MUST store profile attributes: reference, length, width, thickness, type, technical specs, unit price, weight per meter
- **FR-003**: System MUST calculate surface area using formula: Surface = Length × Width (in m²) with type-specific adjustments
- **FR-004**: System MUST calculate weight using formula: Weight = Volume × 2.70 g/cm³ (aluminum density)
- **FR-005**: System MUST calculate material cost: Cost = Weight × Unit Price
- **FR-006**: System MUST calculate margin: Margin = Selling Price − Cost of Goods
- **FR-007**: System MUST support margin display in both absolute value and percentage
- **FR-008**: System MUST support line-level and global discounts on quotes
- **FR-009**: System MUST generate PDF quotes with company header, logo, customer details, line items, totals, terms
- **FR-010**: System MUST support quote workflow statuses: Brouillon, Envoyé, Accepté, Refusé, Expiré
- **FR-011**: System MUST support order workflow statuses: En attente, Confirmée, En production, Terminée
- **FR-012**: System MUST support delivery workflow statuses: Préparée, Expédiée, Livrée
- **FR-013**: System MUST support invoice workflow statuses: Brouillon, Envoyée, Payée
- **FR-014**: System MUST calculate and include VAT (TVA) at configurable rate (default 20%)
- **FR-015**: System MUST allow quote duplication for similar requests

### Key Entities *(include if feature involves data)*

- **AluminumProfile**: id, reference, name, type, length, width, thickness, technical_specs, unit_price, weight_per_meter, density, is_active, created_at
- **Quote**: id, quote_number, customer_id, commercial_id, status, subtotal, discount_percent, discount_amount, vat_amount, total, valid_until, notes, created_at, updated_at
- **QuoteLine**: id, quote_id, profile_id, quantity, unit_length, surface_m2, weight_kg, unit_price, total_price
- **CustomerOrder**: id, order_number, quote_id, customer_id, status, delivery_date, notes, created_at
- **ProductionOrder**: id, production_number, customer_order_id, status, planned_start, planned_end, actual_start, actual_end, notes
- **DeliveryNote**: id, delivery_number, customer_order_id, status, delivery_date, driver_name, signed_by
- **Invoice**: id, invoice_number, customer_order_id, status, issue_date, due_date, payment_terms, subtotal, vat_amount, total, paid_date

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Profile creation with all calculations completes in under 30 seconds
- **SC-002**: Quote generation with 10 line items completes in under 5 seconds
- **SC-003**: Weight calculation accuracy must be within 0.1% of manual calculation
- **SC-004**: Quote-to-order conversion rate is trackable and visible in dashboard
- **SC-005**: PDF quotes are professionally formatted and match company branding

---

## Dependencies

- Requires: 001-auth-security (for user authentication and roles)
- Required by: 006-comptabilite-analytique (for revenue tracking), 008-bi-dashboard (for sales KPIs)
