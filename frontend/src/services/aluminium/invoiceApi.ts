import axios from 'axios';
import { Invoice } from '../../types/aluminium.types';
import { ApiResponse, PaginatedResponse } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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

export const invoiceService = {
  getAll: (params?: { page?: number; perPage?: number; status?: string; customerId?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Invoice>>>('/invoices', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Invoice>>(`/invoices/${id}`),

  createFromOrder: (data: { orderId: string; customerId: string; invoiceDate?: string; dueDate?: string; vatRate?: number; notes?: string }) =>
    api.post<ApiResponse<Invoice>>('/invoices/from-order', data),

  update: (id: string, invoice: Partial<Invoice>) =>
    api.put<ApiResponse<Invoice>>(`/invoices/${id}`, invoice),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/invoices/${id}`),

  send: (id: string) =>
    api.post<ApiResponse<Invoice>>(`/invoices/${id}/send`),

  getPdf: (id: string) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),

  getStatistics: () =>
    api.get<ApiResponse<any>>('/invoices/statistics'),
};

export default api;
