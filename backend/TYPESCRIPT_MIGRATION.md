# TypeScript Migration Plan

## Overview
This plan outlines the steps to migrate from loose `any` types to properly typed interfaces across the ERP Aluminium backend.

## Priority Levels

### P0 - Critical (Controllers)
Controllers handle user input and are the highest priority for type safety.

1. **InvoiceController** (~20 errors)
   - Create `CreateInvoiceDTO` and `UpdateInvoiceDTO`
   - Type `req.body` properly in all endpoints

2. **OrderController** (~15 errors)
   - Create `CreateOrderDTO` and `UpdateOrderDTO`
   - Type customer and line items properly

3. **QuoteController** (~10 errors)
   - Create `CreateQuoteDTO` and `UpdateQuoteDTO`
   - Type quote lines and calculations

### P1 - High (Services)
Services contain business logic and need proper input/output types.

1. **DashboardService** (BI) - ~30 errors
2. **KPIService** (Comptabilité) - ~25 errors
3. **QualityReportService** - ~15 errors

### P2 - Medium (Utilities)
Utilities need type-safe helpers.

1. **jwt.ts** - Fix token verification return types
2. **validators.ts** - Fix regex escape characters

## Migration Steps

### Step 1: Create DTO Directory
```
src/dto/
  ├── aluminium/
  │   ├── customer.dto.ts
  │   ├── invoice.dto.ts
  │   ├── order.dto.ts
  │   └── quote.dto.ts
  ├── stock/
  │   └── inventory.dto.ts
  └── quality/
      └── inspection.dto.ts
```

### Step 2: Replace `any` with Interfaces
Example transformation:
```typescript
// Before (unsafe)
async create(req: Request, res: Response) {
  const data = req.body;
  await this.service.create(data);
}

// After (safe)
async create(req: Request, res: Response) {
  const data = req.body as CreateInvoiceDTO;
  await this.service.create(data);
}
```

### Step 3: Add Service Type Annotations
```typescript
// Before
async getStats(customerId: any): Promise<any> {}

// After
async getStats(customerId: string): Promise<CustomerStats> {}
```

## ESLint Configuration
Enable stricter TypeScript rules in `.eslintrc.js`:
```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/explicit-function-return-type': 'warn',
}
```

## Testing Strategy
1. Add type checking to CI pipeline
2. Add unit tests that verify data flow through controllers
3. Use TypeScript's strict mode

## Timeline
- P0 (Controllers): 2 hours
- P1 (Services): 4 hours
- P2 (Utilities): 1 hour

## Notes
- Some `any` types may be intentional for dynamic queries - mark with `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- Consider using generics for common service patterns
- Review @typescript-eslint/no-unnecessary-type-assertion warnings