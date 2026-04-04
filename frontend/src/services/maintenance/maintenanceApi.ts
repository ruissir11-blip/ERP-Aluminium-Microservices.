import api from '../api';
import {
  Machine,
  MachineStatus,
  MachineDocument,
  MaintenancePlan,
  MaintenanceFrequency,
  WorkOrder,
  WorkOrderType,
  WorkOrderStatus,
  WorkOrderPriority,
  BreakdownSeverity,
  TRSMetrics,
  MTBFMetrics,
  MTTRMetrics,
  MaintenanceKPIs,
  MaintenanceCostReport,
  PreventiveCorrectiveRatio,
} from '../../types/maintenance.types';

// Machine API
export interface MachineFilters {
  status?: MachineStatus;
  workshop?: string;
  search?: string;
}

export interface CreateMachineInput {
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
  notes?: string;
}

export interface CreateMachineDocumentInput {
  documentType: string;
  documentName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
}

// Work Order API
export interface WorkOrderFilters {
  machineId?: string;
  status?: WorkOrderStatus;
  type?: WorkOrderType;
  priority?: WorkOrderPriority;
  assignedTo?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
}

export interface CreateWorkOrderInput {
  machineId: string;
  maintenancePlanId?: string;
  type: WorkOrderType;
  priority?: WorkOrderPriority;
  title: string;
  description?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  assignedTo?: string;
  createdBy?: string;
}

export interface CompleteWorkOrderInput {
  laborHours?: number;
  laborRate?: number;
  parts?: {
    partId?: string;
    partReference: string;
    partName: string;
    quantity: number;
    unitCost?: number;
  }[];
  completionNotes?: string;
}

export interface ReportBreakdownInput {
  machineId: string;
  type?: WorkOrderType;
  priority?: WorkOrderPriority;
  title: string;
  description?: string;
  severity: BreakdownSeverity;
  symptoms?: string;
}

// Maintenance Plan API
export interface MaintenancePlanFilters {
  machineId?: string;
  isActive?: boolean;
  upcoming?: boolean;
}

export interface CreateMaintenancePlanInput {
  machineId: string;
  description: string;
  taskType: string;
  frequency: MaintenanceFrequency;
  frequencyDays?: number;
  estimatedDurationHours?: number;
  nextDueDate?: string;
  assignedTechnicianId?: string;
}

// Metrics API
export interface MetricsParams {
  startDate: string;
  endDate: string;
}

// API objects
export const machineApi = {
  getAll: (filters: MachineFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.workshop) params.append('workshop', filters.workshop);
    if (filters.search) params.append('search', filters.search);
    return api.get<{ data: Machine[] }>(`/maintenance/machines?${params.toString()}`);
  },

  getActive: () => {
    return api.get<{ data: Machine[] }>('/maintenance/machines/active');
  },

  getBrokenDown: () => {
    return api.get<{ data: Machine[] }>('/maintenance/machines/broken-down');
  },

  getNeedingMaintenance: (days: number = 7) => {
    return api.get<{ data: Machine[] }>(`/maintenance/machines/needing-maintenance?days=${days}`);
  },

  getById: (id: string) => {
    return api.get<{ data: Machine }>(`/maintenance/machines/${id}`);
  },

  create: (input: CreateMachineInput) => {
    return api.post<{ data: Machine }>('/maintenance/machines', input);
  },

  update: (id: string, input: Partial<CreateMachineInput>) => {
    return api.put<{ data: Machine }>(`/maintenance/machines/${id}`, input);
  },

  updateStatus: (id: string, status: MachineStatus) => {
    return api.patch<{ data: Machine }>(`/maintenance/machines/${id}/status`, { status });
  },

  archive: (id: string) => {
    return api.post<{ data: Machine }>(`/maintenance/machines/${id}/archive`);
  },

  reactivate: (id: string) => {
    return api.post<{ data: Machine }>(`/maintenance/machines/${id}/reactivate`);
  },

  updateOperationalHours: (id: string, hours: number) => {
    return api.post<{ data: Machine }>(`/maintenance/machines/${id}/hours`, { hours });
  },

  addDocument: (machineId: string, input: CreateMachineDocumentInput) => {
    return api.post<{ data: MachineDocument }>(`/maintenance/machines/${machineId}/documents`, input);
  },
};

export const workOrderApi = {
  getAll: (filters: WorkOrderFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.machineId) params.append('machineId', filters.machineId);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.scheduledDateFrom) params.append('scheduledDateFrom', filters.scheduledDateFrom);
    if (filters.scheduledDateTo) params.append('scheduledDateTo', filters.scheduledDateTo);
    return api.get<{ data: WorkOrder[] }>(`/maintenance/work-orders?${params.toString()}`);
  },

  getOverdue: () => {
    return api.get<{ data: WorkOrder[] }>('/maintenance/work-orders/overdue');
  },

  getByTechnician: (userId: string) => {
    return api.get<{ data: WorkOrder[] }>(`/maintenance/work-orders/technician/${userId}`);
  },

  getById: (id: string) => {
    return api.get<{ data: WorkOrder }>(`/maintenance/work-orders/${id}`);
  },

  create: (input: CreateWorkOrderInput) => {
    return api.post<{ data: WorkOrder }>('/maintenance/work-orders', input);
  },

  reportBreakdown: (input: ReportBreakdownInput) => {
    return api.post<{ data: WorkOrder }>('/maintenance/work-orders/breakdown', input);
  },

  update: (id: string, input: Partial<CreateWorkOrderInput>) => {
    return api.put<{ data: WorkOrder }>(`/maintenance/work-orders/${id}`, input);
  },

  assign: (id: string, assignedTo: string) => {
    return api.post<{ data: WorkOrder }>(`/maintenance/work-orders/${id}/assign`, { assignedTo });
  },

  start: (id: string) => {
    return api.post<{ data: WorkOrder }>(`/maintenance/work-orders/${id}/start`);
  },

  complete: (id: string, input: CompleteWorkOrderInput) => {
    return api.post<{ data: WorkOrder }>(`/maintenance/work-orders/${id}/complete`, input);
  },

  close: (id: string) => {
    return api.post<{ data: WorkOrder }>(`/maintenance/work-orders/${id}/close`);
  },

  cancel: (id: string) => {
    return api.post<{ data: WorkOrder }>(`/maintenance/work-orders/${id}/cancel`);
  },

  acknowledge: (id: string) => {
    return api.post(`/maintenance/work-orders/${id}/acknowledge`);
  },
};

export const maintenancePlanApi = {
  getAll: (filters: MaintenancePlanFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.machineId) params.append('machineId', filters.machineId);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.upcoming) params.append('upcoming', 'true');
    return api.get<{ data: MaintenancePlan[] }>(`/maintenance/plans?${params.toString()}`);
  },

  getDue: (days: number = 30) => {
    return api.get<{ data: MaintenancePlan[] }>(`/maintenance/plans/due?days=${days}`);
  },

  getById: (id: string) => {
    return api.get<{ data: MaintenancePlan }>(`/maintenance/plans/${id}`);
  },

  create: (input: CreateMaintenancePlanInput) => {
    return api.post<{ data: MaintenancePlan }>('/maintenance/plans', input);
  },

  update: (id: string, input: Partial<CreateMaintenancePlanInput>) => {
    return api.put<{ data: MaintenancePlan }>(`/maintenance/plans/${id}`, input);
  },

  deactivate: (id: string) => {
    return api.post<{ data: MaintenancePlan }>(`/maintenance/plans/${id}/deactivate`);
  },

  reactivate: (id: string) => {
    return api.post<{ data: MaintenancePlan }>(`/maintenance/plans/${id}/reactivate`);
  },

  complete: (id: string, completedDate?: string) => {
    return api.post<{ data: MaintenancePlan }>(`/maintenance/plans/${id}/complete`, { completedDate });
  },

  generateWorkOrders: () => {
    return api.post<{ message: string; data: WorkOrder[] }>('/maintenance/plans/generate-work-orders');
  },
};

export const metricsApi = {
  getTRS: (machineId: string, params: MetricsParams) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ data: TRSMetrics }>(`/maintenance/metrics/trs/${machineId}?${query}`);
  },

  getMTBF: (machineId: string, params: MetricsParams) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ data: MTBFMetrics }>(`/maintenance/metrics/mtbf/${machineId}?${query}`);
  },

  getMTTR: (machineId: string, params: MetricsParams) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ data: MTTRMetrics }>(`/maintenance/metrics/mttr/${machineId}?${query}`);
  },

  getKPIs: (machineId: string, params: MetricsParams) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ data: MaintenanceKPIs }>(`/maintenance/metrics/kpis/${machineId}?${query}`);
  },

  getAllMachineMetrics: (params: MetricsParams) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ data: MaintenanceKPIs[] }>(`/maintenance/metrics/all?${query}`);
  },

  getCostReport: (machineId: string, params: MetricsParams) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ data: MaintenanceCostReport }>(`/maintenance/metrics/costs/${machineId}?${query}`);
  },

  getPreventiveCorrectiveRatio: (params: MetricsParams) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ data: PreventiveCorrectiveRatio }>(`/maintenance/metrics/ratio?${query}`);
  },
};

export default {
  machine: machineApi,
  workOrder: workOrderApi,
  maintenancePlan: maintenancePlanApi,
  metrics: metricsApi,
};
