import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: `${API_URL}/auth`,
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

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      mfaEnabled: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface MfaRequiredResponse {
  success: boolean;
  data: {
    requiresMfa: true;
    tempToken: string;
  };
}

export const authApi = {
  // T034: Implement auth API service
  login: async (credentials: LoginCredentials): Promise<AuthResponse | MfaRequiredResponse> => {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> => {
    const response = await api.post('/refresh-token', { refreshToken });
    return response.data.data;
  },

  // T064: Implement forgot password endpoint
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  // T065: Implement reset password endpoint
  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/reset-password', { token, newPassword });
    return response.data;
  },

  // MFA endpoints
  setupMfa: async (): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> => {
    const response = await api.post('/mfa/setup');
    return response.data.data;
  },

  verifyMfa: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/mfa/verify', { token });
    return response.data;
  },

  disableMfa: async (password: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/mfa/disable', { password });
    return response.data;
  },

  regenerateBackupCodes: async (): Promise<{ backupCodes: string[] }> => {
    const response = await api.post('/mfa/backup-codes');
    return response.data.data;
  },

  // MFA login verification
  verifyMfaLogin: async (tempToken: string, token: string): Promise<AuthResponse> => {
    const response = await api.post('/mfa/verify-login', { tempToken, token });
    return response.data;
  },
};

export default authApi;
