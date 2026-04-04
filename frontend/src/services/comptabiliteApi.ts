import axios from './api';
import {
  CostComponent,
  CostComponentInput,
  ProductCost,
  ProductCostSummary,
  OrderCosting,
  OrderCostingSummary,
  CustomerProfitability,
  CustomerProfitabilitySummary,
  CommercialPerformance,
  CommercialLeaderboard,
  DashboardKPI,
  DSOData,
  ReceivableAging,
  EquipmentROI,
  ROIScenario,
  PaginatedResponse,
} from '../types/comptabilite.types';

// Base URL for comptabilite API
const BASE_URL = '/api/comptabilite';

// Cost Component API
export const costComponentApi = {
  getAll: async (params?: { type?: string; is_active?: boolean }) => {
    const response = await axios.get<CostComponent[]>(`${BASE_URL}/cost-components`, { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axios.get<CostComponent>(`${BASE_URL}/cost-components/${id}`);
    return response.data;
  },

  create: async (data: CostComponentInput) => {
    const response = await axios.post<CostComponent>(`${BASE_URL}/cost-components`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CostComponentInput>) => {
    const response = await axios.put<CostComponent>(`${BASE_URL}/cost-components/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/cost-components/${id}`);
    return response.data;
  },
};

// Product Cost API
export const productCostApi = {
  getAll: async (params?: { page?: number; perPage?: number; sortBy?: string; sortOrder?: string }) => {
    const response = await axios.get<PaginatedResponse<ProductCost>>(`${BASE_URL}/product-costs`, { params });
    return response.data;
  },

  getByProfileId: async (profileId: string) => {
    const response = await axios.get<ProductCost>(`${BASE_URL}/product-costs/${profileId}`);
    return response.data;
  },

  recalculate: async (profileId?: string) => {
    const url = profileId 
      ? `${BASE_URL}/costs/recalculate?profileId=${profileId}`
      : `${BASE_URL}/costs/recalculate`;
    const response = await axios.post(url);
    return response.data;
  },
};

// Order Costing API
export const orderCostingApi = {
  getAll: async (params?: {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: string;
    start_date?: string;
    end_date?: string;
    min_margin?: number;
  }) => {
    const response = await axios.get<PaginatedResponse<OrderCosting>>(`${BASE_URL}/orders`, { params });
    return response.data;
  },

  getByOrderId: async (orderId: string) => {
    const response = await axios.get<OrderCosting>(`${BASE_URL}/orders/${orderId}/costing`);
    return response.data;
  },

  recalculate: async (orderId: string) => {
    const response = await axios.post(`${BASE_URL}/orders/${orderId}/recalculate-costing`);
    return response.data;
  },
};

// Customer Profitability API
export const customerProfitabilityApi = {
  getAll: async (params?: {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: string;
    min_margin?: number;
    max_margin?: number;
  }) => {
    const response = await axios.get<PaginatedResponse<CustomerProfitability>>(`${BASE_URL}/customers/profitability`, { params });
    return response.data;
  },

  getByCustomerId: async (customerId: string) => {
    const response = await axios.get<CustomerProfitability>(`${BASE_URL}/customers/${customerId}/profitability`);
    return response.data;
  },

  recalculate: async (customerId?: string) => {
    const url = customerId
      ? `${BASE_URL}/customers/${customerId}/recalculate-profitability`
      : `${BASE_URL}/customers/recalculate-profitability`;
    const response = await axios.post(url);
    return response.data;
  },

  recalculateAll: async () => {
    const response = await axios.post(`${BASE_URL}/customers/recalculate-all-profitability`);
    return response.data;
  },
};

// Commercial Performance API
export const commercialPerformanceApi = {
  getAll: async (params?: {
    page?: number;
    perPage?: number;
    period?: string;
    year?: number;
  }) => {
    const response = await axios.get<PaginatedResponse<CommercialPerformance>>(`${BASE_URL}/commercials/performance`, { params });
    return response.data;
  },

  getByCommercialId: async (commercialId: string, params?: { period?: string; year?: number }) => {
    const response = await axios.get<CommercialPerformance>(`${BASE_URL}/commercials/${commercialId}/performance`, { params });
    return response.data;
  },

  getLeaderboard: async (params?: { period?: string; year?: number; limit?: number }) => {
    const response = await axios.get<CommercialLeaderboard[]>(`${BASE_URL}/commercials/leaderboard`, { params });
    return response.data;
  },

  recalculate: async () => {
    const response = await axios.post(`${BASE_URL}/commercials/recalculate`);
    return response.data;
  },
};

// KPI API
export const kpiApi = {
  getDSO: async (params?: { period?: string; year?: number }) => {
    const response = await axios.get<DSOData>(`${BASE_URL}/kpis/dso`, { params });
    return response.data;
  },

  getAging: async (params?: { period?: string; year?: number; customer_id?: string }) => {
    const response = await axios.get<ReceivableAging[]>(`${BASE_URL}/kpis/aging`, { params });
    return response.data;
  },

  getDashboard: async () => {
    const response = await axios.get<DashboardKPI>(`${BASE_URL}/kpis/dashboard`);
    return response.data;
  },

  recalculate: async () => {
    const response = await axios.post(`${BASE_URL}/kpis/recalculate`);
    return response.data;
  },
};

// ROI API
export const roiApi = {
  getByEquipmentId: async (equipmentId: string) => {
    const response = await axios.get<EquipmentROI>(`${BASE_URL}/roi/${equipmentId}`);
    return response.data;
  },

  calculate: async (data: {
    equipment_id?: string;
    investment_cost: string;
    annual_benefit: string;
    years?: number;
  }) => {
    const response = await axios.post<ROIScenario>(`${BASE_URL}/roi/calculate`, data);
    return response.data;
  },

  compare: async (scenarios: Array<{
    equipment_id?: string;
    investment_cost: string;
    annual_benefit: string;
    years?: number;
  }>) => {
    const response = await axios.post<ROIScenario[]>(`${BASE_URL}/roi/compare`, { scenarios });
    return response.data;
  },
};

// Export all APIs as a single object
export const comptabiliteApi = {
  costComponent: costComponentApi,
  productCost: productCostApi,
  orderCosting: orderCostingApi,
  customerProfitability: customerProfitabilityApi,
  commercialPerformance: commercialPerformanceApi,
  kpi: kpiApi,
  roi: roiApi,
};

export default comptabiliteApi;
