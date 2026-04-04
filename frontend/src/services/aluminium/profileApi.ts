import api from '../api';
import { AluminumProfile, ProfileType, CalculationResult } from '../../types/aluminium.types';

export interface ProfileFilters {
  type?: ProfileType;
  isActive?: boolean;
  search?: string;
}

export interface CreateProfileInput {
  reference: string;
  name: string;
  type: ProfileType;
  length?: number;
  width?: number;
  thickness?: number;
  unitPrice: number;
  weightPerMeter?: number;
  density?: number;
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {
  isActive?: boolean;
}

export interface CalculationInput {
  length: number;
  quantity?: number;
}

export const profileApi = {
  // Get all profiles with optional filtering
  getAll: (filters: ProfileFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.search) params.append('search', filters.search);
    
    return api.get<{ data: AluminumProfile[] }>(`/profiles?${params.toString()}`);
  },

  // Get profile by ID
  getById: (id: string) => {
    return api.get<{ data: AluminumProfile }>(`/profiles/${id}`);
  },

  // Create new profile
  create: (input: CreateProfileInput) => {
    return api.post<{ data: AluminumProfile }>('/profiles', input);
  },

  // Update profile
  update: (id: string, input: UpdateProfileInput) => {
    return api.put<{ data: AluminumProfile }>(`/profiles/${id}`, input);
  },

  // Deactivate profile (soft delete)
  delete: (id: string) => {
    return api.delete(`/profiles/${id}`);
  },

  // Calculate weight and surface for given dimensions
  calculate: (id: string, input: CalculationInput) => {
    return api.post<{ data: CalculationResult }>(`/profiles/${id}/calculate`, input);
  },
};

export default profileApi;
