/**
 * Types for Analytical Accounting (Comptabilité Analytique) Module
 */

// Cost Component Types
export type CostComponentType = 'material' | 'labor' | 'overhead';

export interface CostComponent {
  id: string;
  name: string;
  type: CostComponentType;
  rate: string; // Decimal as string for precision
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostComponentInput {
  name: string;
  type: CostComponentType;
  rate: string;
  unit: string;
  is_active?: boolean;
}

// Product Cost Types
export interface ProductCost {
  id: string;
  profileId: string;
  profileName?: string;
  materialCost: string;
  laborCost: string;
  overheadCost: string;
  totalCost: string;
  calculatedAt: string;
  profile?: {
    id: string;
    name: string;
    reference: string;
  };
}

export interface ProductCostSummary {
  id: string;
  profileId: string;
  profileName: string;
  profileReference: string;
  costs: {
    material: string;
    labor: string;
    overhead: string;
    total: string;
  };
  calculatedAt: string;
}

// Order Costing Types
export interface OrderCosting {
  id: string;
  orderId: string;
  orderReference?: string;
  materialCost: string;
  laborCost: string;
  overheadCost: string;
  totalCost: string;
  revenue: string;
  margin: string;
  marginPercent: string;
  estimatedCost: string;
  variance: string;
  variancePercent: string;
  calculatedAt: string;
  order?: {
    id: string;
    reference: string;
    customerName: string;
  };
}

export interface OrderCostingSummary {
  orderId: string;
  orderReference: string;
  customerName: string;
  revenue: string;
  totalCost: string;
  margin: string;
  marginPercent: string;
  variancePercent: string;
  status: 'profitable' | 'warning' | 'loss';
}

// Customer Profitability Types (camelCase to match backend)
export interface CustomerProfitability {
  id: string;
  customerId: string;
  customerName?: string;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercent: number;
  orderCount: number;
  calculatedAt: string;
  customer?: {
    id: string;
    companyName: string;
    code: string;
  };
}

export interface CustomerProfitabilitySummary {
  customerId: string;
  customerName: string;
  customerCode: string;
  totalRevenue: number;
  totalMargin: number;
  marginPercent: number;
  orderCount: number;
  status: 'profitable' | 'warning' | 'loss';
}

// Commercial Performance Types
export interface CommercialPerformance {
  id: string;
  commercialId: string;
  commercialName?: string;
  period: string; // YYYY-MM format
  totalRevenue: string;
  totalMargin: string;
  marginPercent: string;
  quoteCount: number;
  quoteConverted: number;
  conversionRate: string;
  targetRevenue: string;
  achievementPercent: string;
  calculatedAt: string;
  commercial?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CommercialLeaderboard {
  commercialId: string;
  commercialName: string;
  totalRevenue: string;
  marginPercent: string;
  conversionRate: string;
  achievementPercent: string;
  rank: number;
}

// Financial KPI Types
export type KPIType = 'dso' | 'margin' | 'revenue' | 'profit' | 'receivables';

export interface FinancialKPI {
  id: string;
  kpiType: KPIType;
  value: string;
  period: string;
  calculatedAt: string;
  trend?: 'up' | 'down' | 'stable';
  previousValue?: string;
}

export interface DSOData {
  currentDso: string;
  previousDso: string;
  trend: 'improving' | 'declining' | 'stable';
  agingBuckets: {
    current: string;
    thirtyDays: string;
    sixtyDays: string;
    ninetyPlus: string;
  };
}

export interface DashboardKPI {
  revenueMtd: string;
  revenueYtd: string;
  marginMtd: string;
  marginYtd: string;
  currentDso: string;
  outstandingReceivables: string;
  dsoTrend: 'improving' | 'declining' | 'stable';
  topCustomers: Array<{
    name: string;
    revenue: string;
    margin: string;
  }>;
}

// Receivable Aging Types
export interface ReceivableAging {
  id: string;
  customerId: string;
  customerName?: string;
  period: string;
  current: string;
  days30: string;
  days60: string;
  days90Plus: string;
  total: string;
  calculatedAt: string;
}

// Equipment ROI Types
export interface EquipmentROI {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  investmentCost: string;
  annualBenefit: string;
  roiPercent: string;
  paybackYears: string;
  calculatedAt: string;
  machine?: {
    id: string;
    name: string;
    reference: string;
  };
}

export interface ROIScenario {
  equipmentId: string;
  investmentCost: string;
  annualBenefit: string;
  years: number;
  roiPercent: string;
  paybackYears: string;
  cumulativeBenefit: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Filter Types
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface PeriodFilter {
  period?: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number;
}

export interface MarginFilter {
  minMargin?: number;
  maxMargin?: number;
}
