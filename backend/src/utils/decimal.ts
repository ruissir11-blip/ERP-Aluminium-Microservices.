import Decimal from 'decimal.js';

// Configure decimal.js for financial calculations
// 20 decimal places for high precision, rounding half up
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

export { Decimal };

/**
 * Helper to create a Decimal from a number or string
 */
export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}

/**
 * Add two values with decimal precision
 */
export function add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

/**
 * Subtract two values with decimal precision
 */
export function subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Multiply two values with decimal precision
 */
export function multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Divide two values with decimal precision
 */
export function divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).dividedBy(toDecimal(b));
}

/**
 * Calculate percentage: (value / total) * 100
 */
export function percentage(value: number | string | Decimal, total: number | string | Decimal): Decimal {
  if (toDecimal(total).isZero()) {
    return new Decimal(0);
  }
  return toDecimal(value).dividedBy(toDecimal(total)).times(100);
}

/**
 * Round to specified decimal places
 */
export function round(value: number | string | Decimal, decimals: number = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}

/**
 * Format as currency string
 */
export function formatCurrency(value: number | string | Decimal, decimals: number = 2): string {
  return toDecimal(value).toFixed(decimals, Decimal.ROUND_HALF_UP);
}

/**
 * Calculate margin: revenue - cost
 */
export function margin(revenue: number | string | Decimal, cost: number | string | Decimal): Decimal {
  return toDecimal(revenue).minus(toDecimal(cost));
}

/**
 * Calculate margin percentage: (margin / revenue) * 100
 */
export function marginPercent(revenue: number | string | Decimal, cost: number | string | Decimal): Decimal {
  if (toDecimal(revenue).isZero()) {
    return new Decimal(0);
  }
  const marg = margin(revenue, cost);
  return percentage(marg, revenue);
}

/**
 * Calculate DSO: (Accounts Receivable / Annual Revenue) * 365
 */
export function calculateDSO(
  accountsReceivable: number | string | Decimal,
  annualRevenue: number | string | Decimal
): Decimal {
  if (toDecimal(annualRevenue).isZero()) {
    return new Decimal(0);
  }
  return divide(accountsReceivable, annualRevenue).times(365);
}

/**
 * Calculate ROI: (Annual Benefit / Investment Cost) * 100
 */
export function calculateROI(
  annualBenefit: number | string | Decimal,
  investmentCost: number | string | Decimal
): Decimal {
  if (toDecimal(investmentCost).isZero()) {
    return new Decimal(0);
  }
  return percentage(annualBenefit, investmentCost);
}

/**
 * Calculate Payback Period: Investment / Annual Cash Flow
 */
export function calculatePayback(
  investmentCost: number | string | Decimal,
  annualCashFlow: number | string | Decimal
): Decimal {
  if (toDecimal(annualCashFlow).isZero()) {
    return new Decimal(0);
  }
  return divide(investmentCost, annualCashFlow);
}

export default {
  Decimal,
  toDecimal,
  add,
  subtract,
  multiply,
  divide,
  percentage,
  round,
  formatCurrency,
  margin,
  marginPercent,
  calculateDSO,
  calculateROI,
  calculatePayback,
};
