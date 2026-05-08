import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AluminumProfile, 
  Quote, 
  CustomerOrder, 
  StockItem, 
  StockMovement,
  DashboardKPIs,
  MonthlyRevenue,
  StockDistribution,
  Customer,
  ApiResponse,
  PaginatedResponse
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

// Process queue after token refresh
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling with token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process queued requests
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (email: string, password: string) => 
    api.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string; expiresIn: number }; user: any }>>('/auth/login', { email, password }),
  
  register: (userData: any) => 
    api.post<ApiResponse<any>>('/auth/register', userData),
  
  logout: () => 
    api.post<ApiResponse<void>>('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>>('/auth/refresh-token', { refreshToken }),
  
  getCurrentUser: () => 
    api.get<ApiResponse<any>>('/auth/me'),
};

// Generic API methods
export const apiClient = {
  get: <T>(url: string, config?: any) => api.get<T>(url, config),
  post: <T>(url: string, data?: any, config?: any) => api.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config?: any) => api.put<T>(url, data, config),
  patch: <T>(url: string, data?: any, config?: any) => api.patch<T>(url, data, config),
  delete: <T>(url: string, config?: any) => api.delete<T>(url, config),
};

// Profile Service (Module A)
export const profileService = {
  getAll: (params?: { page?: number; perPage?: number; type?: string; search?: string }) => 
    api.get<ApiResponse<{
      data: AluminumProfile[];
      total: number;
      totalPages: number;
      currentPage: number;
      perPage: number;
    }>>('/profiles', { params }),
  
  getById: (id: string) => 
    api.get<ApiResponse<AluminumProfile>>(`/profiles/${id}`),
  
  create: (profile: Partial<AluminumProfile>) => 
    api.post<ApiResponse<AluminumProfile>>('/profiles', profile),
  
  update: (id: string, profile: Partial<AluminumProfile>) => 
    api.patch<ApiResponse<AluminumProfile>>(`/profiles/${id}`, profile),
  
  delete: (id: string) => 
    api.delete<ApiResponse<void>>(`/profiles/${id}`),
  
  calculate: (data: { length: number; width: number; thickness: number; type: string; unitPrice: number }) => 
    api.post<ApiResponse<any>>('/profiles/calculate', data),
};

// Customer Service
export const customerService = {
  getAll: (params?: { page?: number; perPage?: number; search?: string }) => 
    api.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params }),
  
  getActive: () => 
    api.get<ApiResponse<Customer[]>>('/customers/active'),
  
  getById: (id: string) => 
    api.get<ApiResponse<Customer>>(`/customers/${id}`),
  
  create: (customer: Partial<Customer>) => 
    api.post<ApiResponse<Customer>>('/customers', customer),
  
  update: (id: string, customer: Partial<Customer>) => 
    api.put<ApiResponse<Customer>>(`/customers/${id}`, customer),
  
  delete: (id: string) => 
    api.delete<ApiResponse<void>>(`/customers/${id}`),
};

// Quote Service (Module A)
export const quoteService = {
  getAll: (params?: { page?: number; perPage?: number; status?: string; customerId?: string }) => 
    api.get<ApiResponse<PaginatedResponse<Quote>>>('/quotes', { params }),
  
  getById: (id: string) => 
    api.get<ApiResponse<Quote>>(`/quotes/${id}`),
  
  create: (quote: Partial<Quote>) => 
    api.post<ApiResponse<Quote>>('/quotes', quote),
  
  update: (id: string, quote: Partial<Quote>) => 
    api.patch<ApiResponse<Quote>>(`/quotes/${id}`, quote),
  
  updateStatus: (id: string, status: string) => 
    api.patch<ApiResponse<Quote>>(`/quotes/${id}/status`, { status }),
  
  generatePdf: (id: string) => 
    api.get(`/quotes/${id}/pdf`, { responseType: 'blob' }),
  
  convertToOrder: (id: string) => 
    api.post<ApiResponse<CustomerOrder>>(`/quotes/${id}/convert-to-order`),
};

// Order Service (Module A)
export const orderService = {
  getAll: (params?: { page?: number; perPage?: number; status?: string; customerId?: string }) => 
    api.get<ApiResponse<PaginatedResponse<CustomerOrder>>>('/orders', { params }),
  
  getById: (id: string) => 
    api.get<ApiResponse<CustomerOrder>>(`/orders/${id}`),
  
  create: (order: Partial<CustomerOrder>) => 
    api.post<ApiResponse<CustomerOrder>>('/orders', order),
  
  updateStatus: (id: string, status: string) => 
    api.patch<ApiResponse<CustomerOrder>>(`/orders/${id}/status`, { status }),
  
  update: (id: string, data: Partial<CustomerOrder>) => 
    api.patch<ApiResponse<CustomerOrder>>(`/orders/${id}`, data),

  generateDeliveryNote: (id: string) => 
    api.get(`/orders/${id}/delivery-note`, { responseType: 'blob' }),
};

// Stock Service (Module B)
export const stockService = {
  getAll: (params?: { page?: number; perPage?: number; warehouseId?: string; lowStock?: boolean }) => 
    api.get<ApiResponse<PaginatedResponse<StockItem>>>('/stock/inventory', { params }),
  
  getById: (id: string) => 
    api.get<ApiResponse<StockItem>>(`/stock/${id}`),
  
  updateQuantity: (id: string, quantity: number, reason: string) => 
    api.patch<ApiResponse<StockItem>>(`/stock/${id}/quantity`, { quantity, reason }),
  
  getMovements: (params?: { stockItemId?: string; page?: number; perPage?: number }) => 
    api.get<ApiResponse<PaginatedResponse<StockMovement>>>('/stock/movements', { params }),
  
  createMovement: (movement: Partial<StockMovement>) => 
    api.post<ApiResponse<StockMovement>>('/stock/movements', movement),
  
  getAlerts: () => 
    api.get<ApiResponse<StockItem[]>>('/stock/alerts'),
};

// Warehouse Service
export const warehouseService = {
  getAll: () => 
    api.get<ApiResponse<any[]>>('/stock/warehouses'),
};

// Dashboard Service (Module F)
export const dashboardService = {
  getKPIs: () => 
    api.get<ApiResponse<DashboardKPIs>>('/dashboard/kpis'),
  
  getMonthlyRevenue: (params?: { months?: number }) => 
    api.get<ApiResponse<MonthlyRevenue[]>>('/dashboard/revenue', { params }),
  
  getStockDistribution: () => 
    api.get<ApiResponse<StockDistribution[]>>('/dashboard/stock-distribution'),
  
  getRecentOrders: (limit?: number) => 
    api.get<ApiResponse<CustomerOrder[]>>('/dashboard/recent-orders', { params: { limit } }),
  
  getStockAlerts: () => 
    api.get<ApiResponse<StockItem[]>>('/dashboard/stock-alerts'),
};

export default api;