/**
 * Stock Module Type Definitions
 * 
 * Frontend type definitions for the Advanced Stock Management module
 */

// Enums
export enum LotQualityStatus {
  APPROVED = 'APPROVED',
  QUARANTINE = 'QUARANTINE',
  REJECTED = 'REJECTED',
}

export enum MovementType {
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  COUNT = 'COUNT',
}

export enum InventoryCountStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  VARIANCE_REVIEW = 'VARIANCE_REVIEW',
  ADJUSTMENT_APPROVED = 'ADJUSTMENT_APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CountType {
  FULL = 'FULL',
  CYCLE = 'CYCLE',
  SPOT = 'SPOT',
}

export enum TraceabilityEvent {
  RECEIPT = 'RECEIPT',
  PRODUCTION = 'PRODUCTION',
  DELIVERY = 'DELIVERY',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
}

// Warehouse Types
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  isActive: boolean;
  allowNegativeStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocation {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouse?: Warehouse;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Lot Types
export interface Lot {
  id: string;
  lotNumber: string;
  profileId: string;
  profileName?: string;
  quantity: number;
  unit: string;
  qualityStatus: LotQualityStatus;
  certificateUrl?: string;
  receivedAt: string;
  supplierId?: string;
  supplierName?: string;
  purchaseOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  profileId: string;
  profileName?: string;
  warehouseId: string;
  warehouseName?: string;
  locationId: string;
  locationName?: string;
  lotId?: string;
  lotNumber?: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint?: number;
  maxStockLevel?: number;
  version: number;
  updatedAt: string;
}

export interface InventorySummary {
  profileId: string;
  profileName: string;
  totalQuantity: number;
  totalValue: number;
  warehouseCount: number;
  unit: string;
}

// Stock Movement Types
export interface StockMovement {
  id: string;
  type: MovementType;
  profileId: string;
  profileName?: string;
  quantity: number;
  unit: string;
  sourceWarehouseId?: string;
  sourceLocationId?: string;
  destinationWarehouseId?: string;
  destinationLocationId?: string;
  lotId?: string;
  lotNumber?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  performedById: string;
  performedByName?: string;
  performedAt: string;
  createdAt: string;
}

export interface StockTransferRequest {
  profileId: string;
  quantity: number;
  sourceWarehouseId: string;
  sourceLocationId: string;
  destinationWarehouseId: string;
  destinationLocationId: string;
  lotId?: string;
  notes?: string;
}

// Alert Types
export interface StockAlert {
  id: string;
  profileId: string;
  profileName?: string;
  warehouseId?: string;
  warehouseName?: string;
  minimumThreshold: number;
  maximumThreshold?: number;
  reorderPoint: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  type: 'MINIMUM' | 'MAXIMUM' | 'REORDER';
  message: string;
  sentAt: string;
  acknowledged: boolean;
}

// Traceability Types
export interface LotTraceability {
  id: string;
  lotId: string;
  lotNumber?: string;
  eventType: TraceabilityEvent;
  eventDate: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  path: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Inventory Count Types
export interface InventoryCount {
  id: string;
  countNumber: string;
  type: CountType;
  status: InventoryCountStatus;
  warehouseId?: string;
  warehouseName?: string;
  locationId?: string;
  locationName?: string;
  profileId?: string;
  profileName?: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdById: string;
  createdByName?: string;
  notes?: string;
  totalLines: number;
  varianceLines: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCountLine {
  id: string;
  countId: string;
  profileId: string;
  profileName?: string;
  locationId: string;
  locationName?: string;
  lotId?: string;
  lotNumber?: string;
  expectedQuantity: number;
  countedQuantity?: number;
  variance?: number;
  unit: string;
  notes?: string;
  countedById?: string;
  countedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Stock Layer Types (FIFO)
export interface StockLayer {
  id: string;
  profileId: string;
  profileName?: string;
  warehouseId: string;
  warehouseName?: string;
  lotId?: string;
  lotNumber?: string;
  quantity: number;
  remainingQuantity: number;
  unitCost: number;
  receiptDate: string;
  layerOrder: number;
  isDepleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Filter Types
export interface InventoryFilter {
  profileId?: string;
  warehouseId?: string;
  locationId?: string;
  lotId?: string;
  lowStock?: boolean;
}

export interface MovementFilter {
  profileId?: string;
  warehouseId?: string;
  type?: MovementType;
  fromDate?: string;
  toDate?: string;
}

export interface AlertFilter {
  profileId?: string;
  warehouseId?: string;
  isTriggered?: boolean;
  isActive?: boolean;
}

// Rotation Analysis Types
export interface RotationMetrics {
  profileId: string;
  profileName: string;
  totalQuantity: number;
  averageAge: number;
  turnoverRate: number;
  slowMovingQuantity: number;
  obsoleteQuantity: number;
}

export interface StockValueByWarehouse {
  warehouseId: string;
  warehouseName: string;
  totalValue: number;
  itemCount: number;
}
