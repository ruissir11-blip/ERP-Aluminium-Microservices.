# Research Document: Aluminum Business Module

**Feature**: 002-module-aluminium  
**Date**: 2026-03-04  
**Status**: Complete - All unknowns resolved

---

## Research Areas & Decisions

### 1. PDF Generation Library

**Unknown**: Which library to use for generating professional PDF quotes?

**Options Considered**:

| Library | Pros | Cons |
|---------|------|------|
| **Puppeteer** | Full HTML/CSS control, header/footer support, page breaks, mature | Requires Chromium (~100MB), slower startup |
| PDFKit | Lightweight, no external dependencies, fast | Manual layout code, complex for rich documents |
| jsPDF | Client-side generation, widely used | Limited styling, poor header/footer support |
| React-PDF | React component approach | Limited feature set, complex for invoices |

**Decision**: Use **Puppeteer**

**Rationale**:
- Professional quote/invoice requires complex layouts (headers, footers, multi-page tables, branding)
- HTML/CSS templates are easier to maintain than imperative PDF code
- Puppeteer's page break control essential for long quotes
- Infrastructure already uses Docker; Chromium size not a concern

**Implementation Notes**:
- Run Puppeteer in separate Node.js process to avoid blocking event loop
- Cache templates for performance
- Use `puppeteer-cluster` for high-volume PDF generation

---

### 2. Decimal Precision for Financial Calculations

**Unknown**: How to ensure exact precision for aluminum calculations and pricing?

**Problem**: JavaScript floating-point arithmetic causes precision errors (e.g., `0.1 + 0.2 !== 0.3`)

**Options Considered**:

| Approach | Pros | Cons |
|----------|------|------|
| **decimal.js** | IEEE 754 compliant, well-tested, immutable | Additional dependency (~10KB) |
| BigInt + manual scaling | Native, no dependency | Complex, error-prone code |
| Store as integers (cents) | Simple for currency | Doesn't work for weight/volume calculations |
| PostgreSQL NUMERIC | Database-level precision | Business logic in SQL is hard to test |

**Decision**: Use **decimal.js** for all calculations

**Rationale**:
- Profile calculations require exact precision (weight = volume × 2.70 g/cm³)
- Financial calculations (margin, VAT) require exact decimal precision
- decimal.js is industry standard, well-tested, handles rounding modes
- TypeORM supports DECIMAL columns mapping to decimal.js

**Implementation Pattern**:
```typescript
import { Decimal } from 'decimal.js';

// Set precision for calculations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

// Example: Weight calculation
const volume = new Decimal(length).times(width).times(thickness).div(1000); // cm³
const density = new Decimal(2.70); // g/cm³
const weight = volume.times(density).div(1000); // kg
```

---

### 3. Aluminum Profile Geometry Formulas

**Unknown**: How to calculate surface area and volume for different profile types?

**Research Findings**:

| Profile Type | Surface Formula | Volume Formula | Notes |
|-------------|-----------------|----------------|-------|
| **Plat** (Flat Bar) | L × W | L × W × T | Simple rectangle |
| **Tube** (Round) | L × π × D | L × π × (D/2)² × (1 - (d/D)²) | D=outer, d=inner diameter |
| **Tube** (Square/Rect) | L × 2 × (W + H) | L × (W × H - w × h) | Outer minus inner rectangle |
| **Cornière** (Angle) | L × (W + H) | L × T × (W + H - T) | L-shape approximation |
| **UPN** (U-Channel) | Complex | Complex | Use manufacturer specs or CAD data |
| **IPE** (I-Beam) | Complex | Complex | Use manufacturer specs or CAD data |

**Decision**: 
- Implement exact formulas for simple profiles (Plat, Tube, Cornière)
- Store pre-calculated surface/volume per meter for complex profiles (UPN, IPE)
- Allow manual override for all calculations

**Rationale**:
- Complex structural profiles (UPN, IPE) have non-standardized dimensions across manufacturers
- Industry practice is to use manufacturer-provided weight per meter
- Manual override ensures flexibility for special cases

**Implementation**:
```typescript
interface ProfileDimensions {
  length: Decimal;      // mm
  width: Decimal;       // mm
  thickness?: Decimal;  // mm (for solid profiles)
  outerWidth?: Decimal; // mm (for hollow profiles)
  innerWidth?: Decimal; // mm (for hollow profiles)
}

class CalculationService {
  calculateSurface(type: ProfileType, dims: ProfileDimensions): Decimal {
    switch(type) {
      case 'PLAT':
        return dims.length.times(dims.width).div(1000000); // m²
      case 'TUBE_ROUND':
        return dims.length.times(Math.PI).times(dims.width).div(1000000);
      // ... etc
    }
  }
}
```

---

### 4. Quote Workflow State Machine

**Unknown**: How to model the quote-to-order workflow?

**Analysis**: Quotes have distinct lifecycle states with business rules:

```
BROUILLON → ENVOYÉ → [ACCEPTÉ → COMMANDE] / REFUSÉ / EXPIRÉ
```

**Decision**: Implement as state machine with event-driven transitions

**State Definitions**:

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| BROUILLON | Draft, editable | → ENVOYÉ, → ANNULÉ |
| ENVOYÉ | Sent to customer | → ACCEPTÉ, → REFUSÉ, → EXPIRÉ |
| ACCEPTÉ | Customer accepted | → COMMANDE (creates order) |
| REFUSÉ | Customer declined | → ARCHIVÉ |
| EXPIRÉ | Past validity date | → ARCHIVÉ |
| ANNULÉ | Cancelled by rep | → ARCHIVÉ |

**Implementation Pattern**:
```typescript
interface QuoteStateMachine {
  currentState: QuoteStatus;
  canTransition(to: QuoteStatus): boolean;
  transition(to: QuoteStatus, userId: string): Promise<void>;
}

// Valid transitions map
const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  BROUILLON: ['ENVOYÉ', 'ANNULÉ'],
  ENVOYÉ: ['ACCEPTÉ', 'REFUSÉ', 'EXPIRÉ'],
  ACCEPTÉ: ['COMMANDE'],
  REFUSÉ: ['ARCHIVÉ'],
  EXPIRÉ: ['ARCHIVÉ'],
  ANNULÉ: ['ARCHIVÉ'],
  ARCHIVÉ: []
};
```

---

### 5. Order-Production-Delivery-Invoice Chain

**Unknown**: How to link orders through production, delivery, and invoicing?

**Decision**: One-to-many relationships with status tracking at each level

```
Quote (1) → CustomerOrder (1) → ProductionOrder (0..n)
                                    ↓
                           DeliveryNote (0..n)
                                    ↓
                              Invoice (0..n)
```

**Entity Relationships**:

| Parent | Child | Relationship Rule |
|--------|-------|-------------------|
| Quote | CustomerOrder | 1:1 - Order created from accepted quote |
| CustomerOrder | ProductionOrder | 1:n - Multiple production batches allowed |
| CustomerOrder | DeliveryNote | 1:n - Partial deliveries supported |
| CustomerOrder | Invoice | 1:n - Progress billing supported |

**Status Propagation**:
- CustomerOrder status updates when all ProductionOrders complete
- DeliveryNote status doesn't auto-update CustomerOrder (manual confirmation)
- Invoice payment triggers CustomerOrder closure

---

### 6. Pricing and Margin Strategy

**Unknown**: How to handle pricing tiers, discounts, and margin calculations?

**Decision**: Three-level pricing with explicit margin control

**Pricing Levels**:

1. **Base Price**: Unit price from AluminumProfile (€/kg)
2. **Line Price**: Base × Quantity, with line-level discount
3. **Global Price**: Sum of lines, with global discount, + VAT

**Margin Calculation**:

```
Material Cost = Weight × Base Price
Selling Price = User-defined or calculated from target margin
Margin Amount = Selling Price - Material Cost
Margin % = (Margin Amount / Selling Price) × 100
```

**Discount Rules**:
- Line-level: Percentage or fixed amount per line
- Global: Percentage off subtotal
- Discount applies to selling price, never to material cost

**Implementation**:
```typescript
interface QuoteLineCalculation {
  materialCost: Decimal;      // Weight × Base Price
  sellingPrice: Decimal;      // User input or calculated
  lineDiscount: Decimal;      // Line-level discount
  lineTotal: Decimal;         // (Selling Price - Discount) × Quantity
}

interface QuoteCalculation {
  subtotal: Decimal;          // Sum of line totals
  globalDiscount: Decimal;    // Global discount amount
  vatAmount: Decimal;         // Subtotal × VAT rate
  total: Decimal;             // Subtotal - Global Discount + VAT
}
```

---

### 7. Customer Data Model

**Unknown**: How to structure customer information for quotes and orders?

**Decision**: Separate Customer entity with billing/shipping addresses

**Customer Entity**:
```typescript
interface Customer {
  id: string;
  code: string;              // Internal reference (C-00001)
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: Address;
  shippingAddress: Address;  // Optional, defaults to billing
  paymentTerms: string;      // "30 days", "Immediate", etc.
  vatNumber: string;         // EU VAT ID
  isActive: boolean;
  createdAt: Date;
}

interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}
```

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| PDF Generation | Puppeteer | Professional output, HTML templating |
| Decimal Precision | decimal.js | Exact financial calculations |
| Profile Geometry | Formulas + Overrides | Exact for simple, manual for complex |
| Quote Workflow | State Machine | Clear business rules, audit trail |
| Order Chain | 1:n Relationships | Partial deliveries/billing supported |
| Pricing | Three-level + Margin | Flexible, auditable pricing |
| Customer Model | Separate Entity | Reusable, address flexibility |

---

## Open Questions for Implementation

None - all research complete. Proceed to Phase 1 design.

---

**Research Version**: 1.0.0 | **Last Updated**: 2026-03-04
