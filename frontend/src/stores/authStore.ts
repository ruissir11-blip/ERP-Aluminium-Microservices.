import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, LoginCredentials, RegisterData } from '../services/authApi';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mfaEnabled: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    // Initialize auth state from localStorage
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      isAuthenticated: !!accessToken,
      isLoading: true, // Start with loading to validate token
      error: null,
    };
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (!accessToken || !refreshToken) {
        setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
        return;
      }

      try {
        // Try to get current user to validate token
        const response = await api.get('/auth/me');
        const user = response.data.data;
        localStorage.setItem('user', JSON.stringify(user));
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        // Token invalid, try to refresh
        try {
          const refreshResponse = await authApi.refreshToken(refreshToken);
          localStorage.setItem('accessToken', refreshResponse.accessToken);
          localStorage.setItem('refreshToken', refreshResponse.refreshToken);
          
          // Get user with new token
          const userResponse = await api.get('/auth/me');
          const user = userResponse.data.data;
          localStorage.setItem('user', JSON.stringify(user));
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (refreshError) {
          // Refresh failed, clear auth state
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.login(credentials);

      // Check if MFA is required
      if ('data' in response && response.data && 'requiresMfa' in response.data) {
        // Store temp token for MFA verification
        // Use sessionStorage instead of localStorage for better security (XSS protection)
        const mfaResponse = response as { data: { requiresMfa: boolean; tempToken: string } };
        sessionStorage.setItem('mfaTempToken', mfaResponse.data.tempToken);
        setState((prev) => ({ ...prev, isLoading: false }));
        throw new Error('MFA_REQUIRED');
      }

      // Type guard for successful login
      const successResponse = response as { data: { user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } } };
      const { user, tokens } = successResponse.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data;

      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
