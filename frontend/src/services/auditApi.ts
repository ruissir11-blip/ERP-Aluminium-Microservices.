import axios from 'axios';

const API_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: `${API_URL}/audit-logs`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuditLog {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  action: string;
  module: string;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  severity: 'info' | 'warning' | 'error';
  createdAt: string;
}

export interface AuditQueryResult {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  module?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
}

// T083: Implement audit API service
export const auditApi = {
  queryAuditLogs: async (filters: AuditFilters, page: number = 1, limit: number = 50): Promise<AuditQueryResult> => {
    const params = new URLSearchParams();
    
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.module) params.append('module', filters.module);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`?${params.toString()}`);
    return response.data.data;
  },

  getAuditLogById: async (id: string): Promise<AuditLog> => {
    const response = await api.get(`/${id}`);
    return response.data.data;
  },

  exportToCsv: async (filters: AuditFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.module) params.append('module', filters.module);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getUniqueActions: async (): Promise<string[]> => {
    const response = await api.get('/actions');
    return response.data.data;
  },

  getUniqueModules: async (): Promise<string[]> => {
    const response = await api.get('/modules');
    return response.data.data;
  },

  getStatistics: async (days: number = 30): Promise<{
    totalLogs: number;
    bySeverity: Record<string, number>;
    byModule: Record<string, number>;
    byAction: Record<string, number>;
  }> => {
    const response = await api.get(`/statistics?days=${days}`);
    return response.data.data;
  },
};

export default auditApi;
