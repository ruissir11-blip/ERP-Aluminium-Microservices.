import api from './api';
import {
  Employee,
  CreateEmployeeDto,
  EmployeeFilters,
  EmployeeListResponse,
  EmployeeStats,
  Department,
  CreateDepartmentDto,
  EmployeeContract,
  CreateContractDto,
  LeaveRequest,
  CreateLeaveRequestDto,
  LeaveBalance,
  Attendance,
  AttendanceReport,
  Payslip,
  GeneratePayslipDto,
  GenerateBatchPayslipDto,
} from '../types/hr.types';

const API_PATH = '/hr';

const hrApi = {
  get: (url: string, config?: any) => api.get(`${API_PATH}${url}`, config),
  post: (url: string, data?: any, config?: any) => api.post(`${API_PATH}${url}`, data, config),
  put: (url: string, data?: any, config?: any) => api.put(`${API_PATH}${url}`, data, config),
  delete: (url: string, config?: any) => api.delete(`${API_PATH}${url}`, config),
};

// ==================== EMPLOYEES ====================
export const employeeApi = {
  list: async (filters: EmployeeFilters = {}): Promise<EmployeeListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await hrApi.get('/employees', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Employee> => {
    const response = await hrApi.get(`/employees/${id}`);
    return response.data.data;
  },

  create: async (data: CreateEmployeeDto): Promise<Employee> => {
    const response = await hrApi.post('/employees', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await hrApi.put(`/employees/${id}`, data);
    return response.data.data;
  },

  archive: async (id: string): Promise<void> => {
    await hrApi.delete(`/employees/${id}`);
  },

  getStats: async (): Promise<EmployeeStats> => {
    const response = await hrApi.get('/employees/stats');
    return response.data.data;
  },
};

// ==================== DEPARTMENTS ====================
export const departmentApi = {
  list: async (includeInactive = false): Promise<Department[]> => {
    const response = await hrApi.get('/departments', {
      params: { includeInactive },
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<Department> => {
    const response = await hrApi.get(`/departments/${id}`);
    return response.data.data;
  },

  create: async (data: CreateDepartmentDto): Promise<Department> => {
    const response = await hrApi.post('/departments', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await hrApi.put(`/departments/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await hrApi.delete(`/departments/${id}`);
  },

  getHierarchy: async (): Promise<Department[]> => {
    const response = await hrApi.get('/departments/hierarchy');
    return response.data.data;
  },
};

// ==================== CONTRACTS ====================
export const contractApi = {
  list: async (filters: { status?: string; employeeId?: string } = {}): Promise<{ contracts: EmployeeContract[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);

    const response = await hrApi.get('/contracts', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<EmployeeContract> => {
    const response = await hrApi.get(`/contracts/${id}`);
    return response.data.data;
  },

  getEmployeeContracts: async (employeeId: string): Promise<EmployeeContract[]> => {
    const response = await hrApi.get(`/employees/${employeeId}/contracts`);
    return response.data.data;
  },

  create: async (data: CreateContractDto): Promise<EmployeeContract> => {
    const response = await hrApi.post('/contracts', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<EmployeeContract>): Promise<EmployeeContract> => {
    const response = await hrApi.put(`/contracts/${id}`, data);
    return response.data.data;
  },

  renew: async (id: string, data: { newEndDate: string; newBaseSalary?: number }): Promise<EmployeeContract> => {
    const response = await hrApi.post(`/contracts/${id}/renew`, data);
    return response.data.data;
  },

  terminate: async (id: string, data: { terminationDate?: string; reason?: string }): Promise<EmployeeContract> => {
    const response = await hrApi.post(`/contracts/${id}/terminate`, data);
    return response.data.data;
  },
};

// ==================== LEAVE ====================
export const leaveApi = {
  list: async (filters: { status?: string; employeeId?: string; leaveType?: string } = {}): Promise<{ requests: LeaveRequest[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.leaveType) params.append('leaveType', filters.leaveType);

    const response = await hrApi.get('/leave-requests', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<LeaveRequest> => {
    const response = await hrApi.get(`/leave-requests/${id}`);
    return response.data.data;
  },

  create: async (data: CreateLeaveRequestDto): Promise<LeaveRequest> => {
    const response = await hrApi.post('/leave-requests', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const response = await hrApi.put(`/leave-requests/${id}`, data);
    return response.data.data;
  },

  approve: async (id: string): Promise<LeaveRequest> => {
    const response = await hrApi.put(`/leave-requests/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string, rejectionReason: string): Promise<LeaveRequest> => {
    const response = await hrApi.put(`/leave-requests/${id}/reject`, { rejectionReason });
    return response.data.data;
  },

  cancel: async (id: string): Promise<void> => {
    await hrApi.delete(`/leave-requests/${id}`);
  },

  getBalance: async (employeeId: string, year?: number): Promise<LeaveBalance> => {
    const params = year ? { year } : {};
    const response = await hrApi.get(`/employees/${employeeId}/leave-balance`, { params });
    return response.data.data;
  },
};

// ==================== ATTENDANCE ====================
export const attendanceApi = {
  list: async (filters: { status?: string; employeeId?: string; startDate?: string; endDate?: string } = {}): Promise<{ attendances: Attendance[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await hrApi.get('/attendances', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Attendance> => {
    const response = await hrApi.get(`/attendances/${id}`);
    return response.data.data;
  },

  getToday: async (employeeId?: string): Promise<Attendance | null> => {
    const params = employeeId ? { employeeId } : {};
    const response = await hrApi.get('/attendances/today', { params });
    return response.data.data;
  },

  checkIn: async (notes?: string): Promise<Attendance> => {
    const response = await hrApi.post('/attendances/check-in', { notes });
    return response.data.data;
  },

  checkOut: async (notes?: string): Promise<Attendance> => {
    const response = await hrApi.post('/attendances/check-out', { notes });
    return response.data.data;
  },

  create: async (data: Partial<Attendance>): Promise<Attendance> => {
    const response = await hrApi.post('/attendances', data);
    return response.data.data;
  },

  getReport: async (startDate: string, endDate: string, departmentId?: string): Promise<AttendanceReport> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (departmentId) params.append('departmentId', departmentId);

    const response = await hrApi.get('/attendances/report', { params });
    return response.data.data;
  },
};

// ==================== PAYSLIPS ====================
export const payslipApi = {
  list: async (filters: { employeeId?: string; status?: string; periodMonth?: number; periodYear?: number; page?: number; limit?: number } = {}): Promise<{ payslips: Payslip[]; total: number; page: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.status) params.append('status', filters.status);
    if (filters.periodMonth) params.append('periodMonth', String(filters.periodMonth));
    if (filters.periodYear) params.append('periodYear', String(filters.periodYear));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await hrApi.get('/payslips', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Payslip> => {
    const response = await hrApi.get(`/payslips/${id}`);
    return response.data.data;
  },

  generate: async (data: GeneratePayslipDto): Promise<Payslip> => {
    const response = await hrApi.post('/payslips/generate', data);
    return response.data.data;
  },

  generateBatch: async (data: GenerateBatchPayslipDto): Promise<any> => {
    const response = await hrApi.post('/payslips/generate-batch', data);
    return response.data.data;
  },

  validate: async (id: string): Promise<Payslip> => {
    const response = await hrApi.put(`/payslips/${id}/validate`);
    return response.data.data;
  },

  markAsPaid: async (id: string): Promise<Payslip> => {
    const response = await hrApi.put(`/payslips/${id}/mark-paid`);
    return response.data.data;
  },
};

export default hrApi;
