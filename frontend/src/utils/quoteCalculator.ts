import { AluminumProfile, QuoteStatus } from '../types';

/**
 * Quote calculator utility for real-time price previews
 * Used in the QuoteBuilder component for instant feedback
 */
export interface QuoteLineCalculation {
  unitWeight: number;
  totalWeight: number;
  unitSurface?: number;
  totalSurface?: number;
  materialCost: number;
  unitPrice: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  vatAmount: number;
  total: number;
}

// Aluminum density in g/cm³
const ALUMINUM_DENSITY = 2.7;

// Helper to get profile type string
function getProfileType(profile: AluminumProfile): string {
  return String(profile.type);
}

/**
 * Calculate weight for a profile based on its dimensions
 */
export function calculateWeight(
  profile: AluminumProfile,
  length: number,
  quantity: number = 1
): number {
  const lengthInMeters = length;
  const lengthInCm = lengthInMeters * 100;
  
  // If profile has weightPerMeter, use it directly
  if (profile.weightPerMeter && profile.weightPerMeter > 0) {
    return profile.weightPerMeter * lengthInMeters * quantity;
  }
  
  // Otherwise calculate based on profile type
  let crossSectionArea = 0; // in cm²
  
  switch (getProfileType(profile)) {
    case 'PLAT':
      // Rectangular bar: width * thickness
      crossSectionArea = (profile.width || 0) * (profile.thickness || 0);
      break;
    case 'TUBE':
      // Hollow tube: outer area - inner area
      const outer = profile.width || 0;
      const inner = Math.max(0, (profile.width || 0) - 2 * (profile.thickness || 0));
      crossSectionArea = outer * outer - inner * inner;
      break;
    case 'CORNIERE':
      // L-shaped: sum of two rectangles
      const leg1 = profile.width || 0;
      const leg2 = profile.thickness || 0;
      crossSectionArea = leg1 * leg2 + leg2 * (leg1 - leg2);
      break;
    default:
      // Fallback: assume rectangular
      crossSectionArea = (profile.width || 10) * (profile.thickness || 2);
  }
  
  // Weight = cross-section area (cm²) * length (cm) * density (g/cm³) / 1000 = kg
  const weightPerUnit = (crossSectionArea * lengthInCm * ALUMINUM_DENSITY) / 1000;
  return weightPerUnit * quantity;
}

/**
 * Calculate surface area for a profile
 */
export function calculateSurface(
  profile: AluminumProfile,
  length: number,
  quantity: number = 1
): number {
  const lengthInMeters = length;
  
  let perimeter = 0; // in mm
  
  switch (getProfileType(profile)) {
    case 'PLAT':
      // Rectangle perimeter: 2 * (width + thickness)
      perimeter = 2 * ((profile.width || 0) + (profile.thickness || 0));
      break;
    case 'TUBE':
      // Square tube: 4 * width
      perimeter = 4 * (profile.width || 0);
      break;
    case 'CORNIERE':
      // L-shaped: 3 * width (simplified)
      perimeter = 3 * (profile.width || 0);
      break;
    default:
      perimeter = 2 * ((profile.width || 10) + (profile.thickness || 2));
  }
  
  // Surface = perimeter (mm) * length (m) / 1000 = m² per unit
  const surfacePerUnit = (perimeter * lengthInMeters) / 1000;
  return surfacePerUnit * quantity;
}

/**
 * Calculate a single quote line
 */
export function calculateQuoteLine(
  profile: AluminumProfile,
  quantity: number,
  unitLength: number,
  unitPrice: number,
  lineDiscount: number = 0
): QuoteLineCalculation {
  const unitWeight = calculateWeight(profile, unitLength, 1);
  const totalWeight = calculateWeight(profile, unitLength, quantity);
  
  const unitSurface = calculateSurface(profile, unitLength, 1);
  const totalSurface = calculateSurface(profile, unitLength, quantity);
  
  // Material cost = weight * profile's unit price (per kg)
  const materialCost = unitWeight * (profile.unitPrice || 0);
  
  // Line total before discount
  const subtotal = unitPrice * quantity;
  const discountAmount = subtotal * (lineDiscount / 100);
  const lineTotal = subtotal - discountAmount;
  
  return {
    unitWeight,
    totalWeight,
    unitSurface,
    totalSurface,
    materialCost,
    unitPrice,
    lineDiscount,
    lineTotal,
  };
}

/**
 * Calculate all quote totals
 */
export function calculateQuoteTotals(
  lines: Array<{
    quantity: number;
    unitPrice: number;
    lineDiscount?: number;
  }>,
  discountPercent: number = 0,
  vatRate: number = 19
): QuoteTotals {
  // Calculate subtotal
  const subtotal = lines.reduce((sum, line) => {
    const lineTotal = line.quantity * line.unitPrice * (1 - (line.lineDiscount || 0) / 100);
    return sum + lineTotal;
  }, 0);
  
  // Calculate discount amount
  const discountAmount = subtotal * (discountPercent / 100);
  
  // Calculate taxable amount
  const taxableAmount = subtotal - discountAmount;
  
  // Calculate VAT
  const vatAmount = taxableAmount * (vatRate / 100);
  
  // Calculate total
  const total = taxableAmount + vatAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, currency: string = 'DT'): string {
  return `${value.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${currency}`;
}

/**
 * Get status color class for display
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'BROUILLON':
      return 'bg-yellow-100 text-yellow-800';
    case 'ENVOYÉ':
      return 'bg-blue-100 text-blue-800';
    case 'ACCEPTÉ':
      return 'bg-green-100 text-green-800';
    case 'REFUSÉ':
      return 'bg-red-100 text-red-800';
    case 'EXPIRÉ':
      return 'bg-gray-100 text-gray-800';
    case 'ANNULÉ':
      return 'bg-gray-100 text-gray-600';
    case 'ARCHIVÉ':
      return 'bg-gray-200 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get status label in French
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'BROUILLON':
      return 'Brouillon';
    case 'ENVOYÉ':
      return 'Envoyé';
    case 'ACCEPTÉ':
      return 'Accepté';
    case 'REFUSÉ':
      return 'Refusé';
    case 'EXPIRÉ':
      return 'Expiré';
    case 'ANNULÉ':
      return 'Annulé';
    case 'ARCHIVÉ':
      return 'Archivé';
    default:
      return status;
  }
}

export default {
  calculateWeight,
  calculateSurface,
  calculateQuoteLine,
  calculateQuoteTotals,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
};
