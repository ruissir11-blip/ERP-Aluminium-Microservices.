import api from './api';

export interface BiDashboard {
  id: string;
  name: string;
  description: string | null;
  type: 'executive' | 'operations' | 'finance' | 'technical' | 'custom';
  isDefault: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetData {
  widgetId: string;
  title: string;
  type: 'kpi_card' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'area_chart' | 'data_table' | 'gauge' | 'heat_map';
  data: unknown;
  config: Record<string, unknown> | null;
}

export interface DashboardData {
  dashboard: BiDashboard;
  widgets: WidgetData[];
}

export const biDashboardService = {
  getDashboards: () => 
    api.get<{ success: boolean; data: BiDashboard[] }>('/bi/dashboards'),
  
  getDashboard: (id: string) => 
    api.get<{ success: boolean; data: BiDashboard }>(`/bi/dashboards/${id}`),
  
  getDashboardData: (id: string, params?: { startDate?: string; endDate?: string }) => 
    api.get<{ success: boolean; data: DashboardData }>(`/bi/dashboards/${id}/data`, { params }),
  
  createDashboard: (data: Partial<BiDashboard>) => 
    api.post<{ success: boolean; data: BiDashboard }>('/bi/dashboards', data),
  
  updateDashboard: (id: string, data: Partial<BiDashboard>) => 
    api.put<{ success: boolean; data: BiDashboard }>(`/bi/dashboards/${id}`, data),
  
  deleteDashboard: (id: string) => 
    api.delete<{ success: boolean; message: string }>(`/bi/dashboards/${id}`),
  
  seedDashboards: () => 
    api.post<{ success: boolean; message: string }>('/bi/seed'),
};
