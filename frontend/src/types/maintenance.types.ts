// Maintenance module types

export enum MachineStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN_DOWN = 'BROKEN_DOWN',
  ARCHIVED = 'ARCHIVED',
}

export interface Machine {
  id: string;
  designation: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  acquisitionValue?: number;
  residualValue?: number;
  workshop?: string;
  locationDetails?: string;
  installationDate?: string;
  operationalHours: number;
  status: MachineStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MachineDocument {
  id: string;
  machineId: string;
  documentType: string;
  documentName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export enum WorkOrderType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  IMPROVEMENT = 'IMPROVEMENT',
  INSPECTION = 'INSPECTION',
}

export enum WorkOrderStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum WorkOrderPriority {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  ROUTINE = 'ROUTINE',
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  machineId: string;
  machine?: Machine;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  title: string;
  description?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartDatetime?: string;
  actualEndDatetime?: string;
  assignedTo?: string;
  createdBy?: string;
  laborHours?: number;
  laborRate?: number;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  notes?: string;
  completionNotes?: string;
  parts?: WorkOrderPart[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface WorkOrderPart {
  id: string;
  workOrderId: string;
  partId?: string;
  partReference: string;
  partName: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  createdAt: string;
}

export enum BreakdownSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
}

export interface BreakdownRecord {
  id: string;
  workOrderId: string;
  machineId: string;
  reportedAt: string;
  acknowledgedAt?: string;
  responseTimeMinutes?: number;
  repairStartTime?: string;
  repairEndTime?: string;
  repairTimeMinutes?: number;
  downtimeMinutes?: number;
  severity: BreakdownSeverity;
  symptoms?: string;
  rootCause?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// Metrics types
export interface TRSMetrics {
  machineId: string;
  machineName: string;
  availability: number;
  performance: number;
  quality: number;
  trs: number;
  period: string;
  plannedProductionTime: number;
  operatingTime: number;
  downtime: number;
}

export interface MTBFMetrics {
  machineId: string;
  machineName: string;
  mtbf: number;
  totalOperatingTime: number;
  numberOfBreakdowns: number;
  period: string;
}

export interface MTTRMetrics {
  machineId: string;
  machineName: string;
  mttr: number;
  totalRepairTime: number;
  numberOfRepairs: number;
  period: string;
}

export interface MaintenanceKPIs {
  machineId: string;
  machineName: string;
  trs: TRSMetrics | null;
  mtbf: MTBFMetrics | null;
  mttr: MTTRMetrics | null;
  totalWorkOrders: number;
  preventiveWorkOrders: number;
  correctiveWorkOrders: number;
  totalMaintenanceCost: number;
  averageResolutionTime: number;
  period: string;
}

export interface MaintenanceCostReport {
  machineId: string;
  machineName: string;
  totalLaborCost: number;
  totalPartsCost: number;
  totalCost: number;
  laborHours: number;
  costPerOperatingHour: number;
  period: string;
}

export interface PreventiveCorrectiveRatio {
  preventive: number;
  corrective: number;
  improvement: number;
  inspection: number;
  total: number;
  ratio: string;
}
