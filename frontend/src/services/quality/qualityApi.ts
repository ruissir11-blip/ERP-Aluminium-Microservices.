import axios from '../api';
import {
  InspectionPoint,
  InspectionPointCreate,
  InspectionCriteria,
  InspectionCriteriaCreate,
  InspectionRecord,
  InspectionRecordCreate,
  InspectionRecordUpdate,
  InspectionRecordFilters,
  NonConformity,
  NonConformityCreate,
  NonConformityUpdate,
  NonConformityFilters,
  NCRootCause,
  NCRootCauseCreate,
  CorrectiveAction,
  CorrectiveActionCreate,
  CorrectiveActionUpdate,
  CorrectiveActionFilters,
  QualityDecision,
  QualityDecisionCreate,
  QualityDecisionUpdate,
  QualityStatistics,
  ParetoData,
  RootCauseStatistics,
} from '../../types/quality.types';

const QUALITY_API = '/quality';

// ==================== INSPECTION POINTS ====================

export const inspectionPointApi = {
  getAll: async (): Promise<InspectionPoint[]> => {
    const response = await axios.get(`${QUALITY_API}/inspection-points`);
    return response.data;
  },

  getById: async (id: string): Promise<InspectionPoint> => {
    const response = await axios.get(`${QUALITY_API}/inspection-points/${id}`);
    return response.data;
  },

  create: async (data: InspectionPointCreate): Promise<InspectionPoint> => {
    const response = await axios.post(`${QUALITY_API}/inspection-points`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<InspectionPointCreate>): Promise<InspectionPoint> => {
    const response = await axios.put(`${QUALITY_API}/inspection-points/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${QUALITY_API}/inspection-points/${id}`);
  },
};

// ==================== INSPECTION CRITERIA ====================

export const inspectionCriteriaApi = {
  getByPointId: async (pointId: string): Promise<InspectionCriteria[]> => {
    const response = await axios.get(`${QUALITY_API}/inspection-criteria/point/${pointId}`);
    return response.data;
  },

  create: async (data: InspectionCriteriaCreate): Promise<InspectionCriteria> => {
    const response = await axios.post(`${QUALITY_API}/inspection-criteria`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<InspectionCriteriaCreate>): Promise<InspectionCriteria> => {
    const response = await axios.put(`${QUALITY_API}/inspection-criteria/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${QUALITY_API}/inspection-criteria/${id}`);
  },
};

// ==================== INSPECTION RECORDS ====================

export const inspectionRecordApi = {
  getAll: async (filters?: InspectionRecordFilters): Promise<InspectionRecord[]> => {
    const response = await axios.get(`${QUALITY_API}/inspection-records`, { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<InspectionRecord> => {
    const response = await axios.get(`${QUALITY_API}/inspection-records/${id}`);
    return response.data;
  },

  getByProductionOrder: async (productionOrderId: string): Promise<InspectionRecord[]> => {
    const response = await axios.get(`${QUALITY_API}/inspection-records/production-order/${productionOrderId}`);
    return response.data;
  },

  create: async (data: InspectionRecordCreate): Promise<InspectionRecord> => {
    const response = await axios.post(`${QUALITY_API}/inspection-records`, data);
    return response.data;
  },

  update: async (id: string, data: InspectionRecordUpdate): Promise<InspectionRecord> => {
    const response = await axios.put(`${QUALITY_API}/inspection-records/${id}`, data);
    return response.data;
  },

  complete: async (id: string, data: InspectionRecordUpdate): Promise<InspectionRecord> => {
    const response = await axios.post(`${QUALITY_API}/inspection-records/${id}/complete`, data);
    return response.data;
  },

  getStatistics: async (): Promise<QualityStatistics> => {
    const response = await axios.get(`${QUALITY_API}/inspection-records/statistics`);
    return response.data;
  },
};

// ==================== NON-CONFORMITIES ====================

export const nonConformityApi = {
  getAll: async (filters?: NonConformityFilters): Promise<NonConformity[]> => {
    const response = await axios.get(`${QUALITY_API}/non-conformities`, { params: filters });
    return response.data;
  },

  getPriority: async (): Promise<NonConformity[]> => {
    const response = await axios.get(`${QUALITY_API}/non-conformities/priority`);
    return response.data;
  },

  getById: async (id: string): Promise<NonConformity> => {
    const response = await axios.get(`${QUALITY_API}/non-conformities/${id}`);
    return response.data;
  },

  getByNCNumber: async (ncNumber: string): Promise<NonConformity> => {
    const response = await axios.get(`${QUALITY_API}/non-conformities/nc-number/${ncNumber}`);
    return response.data;
  },

  getByLot: async (lotNumber: string): Promise<NonConformity[]> => {
    const response = await axios.get(`${QUALITY_API}/non-conformities/lot/${lotNumber}`);
    return response.data;
  },

  create: async (data: NonConformityCreate): Promise<NonConformity> => {
    const response = await axios.post(`${QUALITY_API}/non-conformities`, data);
    return response.data;
  },

  update: async (id: string, data: NonConformityUpdate): Promise<NonConformity> => {
    const response = await axios.put(`${QUALITY_API}/non-conformities/${id}`, data);
    return response.data;
  },

  close: async (id: string, resolutionNotes?: string): Promise<NonConformity> => {
    const response = await axios.post(`${QUALITY_API}/non-conformities/${id}/close`, { resolution_notes: resolutionNotes });
    return response.data;
  },

  getStatistics: async (): Promise<QualityStatistics> => {
    const response = await axios.get(`${QUALITY_API}/non-conformities/statistics`);
    return response.data;
  },
};

// ==================== ROOT CAUSE ANALYSIS ====================

export const rootCauseApi = {
  getAll: async (): Promise<NCRootCause[]> => {
    const response = await axios.get(`${QUALITY_API}/root-causes`);
    return response.data;
  },

  getById: async (id: string): Promise<NCRootCause> => {
    const response = await axios.get(`${QUALITY_API}/root-causes/${id}`);
    return response.data;
  },

  getByNC: async (ncId: string): Promise<NCRootCause[]> => {
    const response = await axios.get(`${QUALITY_API}/root-causes/nc/${ncId}`);
    return response.data;
  },

  create: async (data: NCRootCauseCreate): Promise<NCRootCause> => {
    const response = await axios.post(`${QUALITY_API}/root-causes`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<NCRootCauseCreate>): Promise<NCRootCause> => {
    const response = await axios.put(`${QUALITY_API}/root-causes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${QUALITY_API}/root-causes/${id}`);
  },

  addCinqPourquoi: async (ncId: string, responses: string[]): Promise<NCRootCause> => {
    const response = await axios.post(`${QUALITY_API}/root-causes/nc/${ncId}/cinq-pourquoi`, { responses });
    return response.data;
  },

  addIshikawa: async (ncId: string, categories: Record<string, string[]>): Promise<NCRootCause> => {
    const response = await axios.post(`${QUALITY_API}/root-causes/nc/${ncId}/ishikawa`, { categories });
    return response.data;
  },

  getStatistics: async (): Promise<RootCauseStatistics> => {
    const response = await axios.get(`${QUALITY_API}/root-causes/statistics`);
    return response.data;
  },
};

// ==================== CORRECTIVE ACTIONS ====================

export const correctiveActionApi = {
  getAll: async (filters?: CorrectiveActionFilters): Promise<CorrectiveAction[]> => {
    const response = await axios.get(`${QUALITY_API}/corrective-actions`, { params: filters });
    return response.data;
  },

  getUpcoming: async (): Promise<CorrectiveAction[]> => {
    const response = await axios.get(`${QUALITY_API}/corrective-actions/upcoming`);
    return response.data;
  },

  getById: async (id: string): Promise<CorrectiveAction> => {
    const response = await axios.get(`${QUALITY_API}/corrective-actions/${id}`);
    return response.data;
  },

  getByNC: async (ncId: string): Promise<CorrectiveAction[]> => {
    const response = await axios.get(`${QUALITY_API}/corrective-actions/nc/${ncId}`);
    return response.data;
  },

  create: async (data: CorrectiveActionCreate): Promise<CorrectiveAction> => {
    const response = await axios.post(`${QUALITY_API}/corrective-actions`, data);
    return response.data;
  },

  update: async (id: string, data: CorrectiveActionUpdate): Promise<CorrectiveAction> => {
    const response = await axios.put(`${QUALITY_API}/corrective-actions/${id}`, data);
    return response.data;
  },

  complete: async (id: string): Promise<CorrectiveAction> => {
    const response = await axios.post(`${QUALITY_API}/corrective-actions/${id}/complete`);
    return response.data;
  },

  verify: async (id: string, verification: string): Promise<CorrectiveAction> => {
    const response = await axios.post(`${QUALITY_API}/corrective-actions/${id}/verify`, { effectiveness_verification: verification });
    return response.data;
  },
};

// ==================== QUALITY DECISIONS ====================

export const qualityDecisionApi = {
  getAll: async (): Promise<QualityDecision[]> => {
    const response = await axios.get(`${QUALITY_API}/quality-decisions`);
    return response.data;
  },

  getPending: async (): Promise<QualityDecision[]> => {
    const response = await axios.get(`${QUALITY_API}/quality-decisions/pending`);
    return response.data;
  },

  getById: async (id: string): Promise<QualityDecision> => {
    const response = await axios.get(`${QUALITY_API}/quality-decisions/${id}`);
    return response.data;
  },

  getByNC: async (ncId: string): Promise<QualityDecision[]> => {
    const response = await axios.get(`${QUALITY_API}/quality-decisions/nc/${ncId}`);
    return response.data;
  },

  create: async (data: QualityDecisionCreate): Promise<QualityDecision> => {
    const response = await axios.post(`${QUALITY_API}/quality-decisions`, data);
    return response.data;
  },

  update: async (id: string, data: QualityDecisionUpdate): Promise<QualityDecision> => {
    const response = await axios.put(`${QUALITY_API}/quality-decisions/${id}`, data);
    return response.data;
  },

  approve: async (id: string, notes?: string): Promise<QualityDecision> => {
    const response = await axios.post(`${QUALITY_API}/quality-decisions/${id}/approve`, { notes });
    return response.data;
  },

  reject: async (id: string, notes: string): Promise<QualityDecision> => {
    const response = await axios.post(`${QUALITY_API}/quality-decisions/${id}/reject`, { notes });
    return response.data;
  },

  getStatistics: async (): Promise<QualityStatistics> => {
    const response = await axios.get(`${QUALITY_API}/quality-decisions/statistics`);
    return response.data;
  },
};

// ==================== PARETO ANALYSIS ====================

export const paretoApi = {
  getByDefectType: async (startDate?: Date, endDate?: Date): Promise<ParetoData[]> => {
    const response = await axios.get(`${QUALITY_API}/pareto/by-defect-type`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getByMachine: async (startDate?: Date, endDate?: Date): Promise<ParetoData[]> => {
    const response = await axios.get(`${QUALITY_API}/pareto/by-machine`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getByOperator: async (startDate?: Date, endDate?: Date): Promise<ParetoData[]> => {
    const response = await axios.get(`${QUALITY_API}/pareto/by-operator`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
