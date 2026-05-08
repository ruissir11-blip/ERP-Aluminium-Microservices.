import api from '../api';
import { Quote, QuoteLine, QuoteStatus, CustomerOrder } from '../../types/aluminium.types';

export interface CreateQuoteInput {
  customerId: string;
  validUntil?: string;
  discountPercent?: number;
  vatRate?: number;
  notes?: string;
  customerNotes?: string;
}

export interface QuoteLineInput {
  profileId: string;
  quantity: number;
  unitLength: number;
  unitPrice: number;
  lineDiscount?: number;
  description?: string;
}

export interface QuoteFilters {
  status?: QuoteStatus;
  customerId?: string;
}

export const quoteApi = {
  // Get all quotes with optional filtering
  getAll: (filters: QuoteFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.customerId) params.append('customerId', filters.customerId);
    
    return api.get<{ data: Quote[] }>(`/quotes?${params.toString()}`);
  },

  // Get quote by ID
  getById: (id: string) => {
    return api.get<{ data: Quote }>(`/quotes/${id}`);
  },

  // Create new quote
  create: (input: CreateQuoteInput) => {
    return api.post<{ data: Quote }>('/quotes', input);
  },

  // Add line to quote
  addLine: (quoteId: string, input: QuoteLineInput) => {
    return api.post<{ data: QuoteLine }>(`/quotes/${quoteId}/lines`, input);
  },

  // Update line in quote
  updateLine: (quoteId: string, lineId: string, input: Partial<QuoteLineInput>) => {
    return api.put<{ data: QuoteLine }>(`/quotes/${quoteId}/lines/${lineId}`, input);
  },

  // Remove line from quote
  removeLine: (quoteId: string, lineId: string) => {
    return api.delete(`/quotes/${quoteId}/lines/${lineId}`);
  },

  // Send quote to customer
  send: (quoteId: string) => {
    return api.post<{ data: Quote }>(`/quotes/${quoteId}/send`);
  },

  // Accept quote
  accept: (quoteId: string) => {
    return api.post<{ data: Quote }>(`/quotes/${quoteId}/accept`);
  },

  // Refuse quote
  refuse: (quoteId: string) => {
    return api.post<{ data: Quote }>(`/quotes/${quoteId}/refuse`);
  },

  // Convert quote to order
  convertToOrder: (quoteId: string) => {
    return api.post<{ data: CustomerOrder }>(`/quotes/${quoteId}/convert`);
  },

  // Generate PDF for quote
  generatePdf: (quoteId: string) => {
    return api.get(`/quotes/${quoteId}/pdf`, { responseType: 'blob' });
  },
};

export default quoteApi;
