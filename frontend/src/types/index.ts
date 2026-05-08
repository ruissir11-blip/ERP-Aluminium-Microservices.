// ERP Aluminium TypeScript Types

// User & Authentication
// Note: UserRole is imported from rbac.ts - must be after type export
import type { UserRole } from './rbac';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

// Aluminum Profile (Module A)
export interface AluminumProfile {
  id: string;
  reference: string;
  name: string;
  type: ProfileType;
  length: number; // in mm
  width: number; // in mm
  thickness: number; // in mm
  weightPerMeter: number; // in kg/m
  unitPrice: number; // per kg
  density: number; // default 2.70 g/cm³
  technicalSpecs?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProfileType = 'CORNIÈRE' | 'TUBE' | 'PLAT' | 'UPN' | 'IPE' | 'AUTRE';

// Calculated values
export interface ProfileCalculations {
  surface: number; // in m²
  weight: number; // in kg
  materialCost: number; // in €
  sellingPrice: number; // in €
  margin: number; // in €
  marginPercent: number; // in %
}

// Quote (Devis) - Module A
export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customer: import('./aluminium.types').Customer;
  commercialId: string;
  status: QuoteStatus;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  validUntil: string;
  notes?: string;
  lines: QuoteLine[];
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 'BROUILLON' | 'ENVOYÉ' | 'ACCEPTÉ' | 'REFUSÉ' | 'EXPIRÉ';

export interface QuoteLine {
  id: string;
  quoteId: string;
  profileId: string;
  profile: AluminumProfile;
  quantity: number;
  unitLength: number; // in mm
  surfaceM2: number;
  weightKg: number;
  unitPrice: number;
  totalPrice: number;
}

// Re-export aluminium types (includes Customer)
export * from './aluminium.types';

// Customer - re-exported from aluminium types for backward compatibility
export type { Customer } from './aluminium.types';

// Order (Commande) - Module A
export interface CustomerOrder {
  id: string;
  orderNumber: string;
  quoteId?: string;
  quote?: Quote;
  customerId: string;
  customer: import('./aluminium.types').Customer;
  status: OrderStatus;
  deliveryDate?: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'EN_ATTENTE' | 'CONFIRMÉE' | 'EN_PRODUCTION' | 'TERMINÉE' | 'LIVRÉE';

export interface OrderLine {
  id: string;
  orderId: string;
  profileId: string;
  profile: AluminumProfile;
  quantity: number;
  unitLength: number;
  weightKg: number;
  unitPrice: number;
  totalPrice: number;
}

// Stock (Module B)
export interface StockItem {
  id: string;
  profileId: string;
  profile: AluminumProfile;
  warehouseId: string;
  warehouse: Warehouse;
  quantity: number;
  location?: string; // Allée/Rack/Niveau
  minThreshold: number;
  maxThreshold: number;
  lastMovement?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  profileId?: string;
  warehouseId?: string;
  locationId?: string;
  lotId?: string;
  movementType?: string;
  type?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  notes?: string;
  performedBy?: string;
  performedAt?: string;
  userId?: string;
  createdAt?: string;
}

export type MovementType = 'ENTRÉE' | 'SORTIE' | 'TRANSFERT' | 'INVENTAIRE' | 'AJUSTEMENT' | 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'COUNT';

// Dashboard KPIs
export interface DashboardKPIs {
  chiffreAffaires: number;
  chiffreAffairesChange: number; // percentage
  stockValue: number;
  trs: number; // Taux de Rendement Synthétique
  tauxNonConformite: number;
  tauxNonConformiteChange: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface StockDistribution {
  category: string;
  value: number;
  percentage: number;
}

// Maintenance (Module C)
export interface Machine {
  id: string;
  name: string;
  reference: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: string;
  workshop?: string;
  acquisitionValue?: number;
  status: MachineStatus;
  trs?: number;
  mtbf?: number; // Mean Time Between Failures
  mttr?: number; // Mean Time To Repair
}

export type MachineStatus = 'EN_SERVICE' | 'EN_MAINTENANCE' | 'HORS_SERVICE';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Re-export RBAC utilities
export { getRoleDisplayName, getDefaultRouteForRole } from './rbac';