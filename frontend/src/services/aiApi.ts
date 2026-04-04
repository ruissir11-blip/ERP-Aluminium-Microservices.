// AI Module API Service
// Provides functions to interact with the AI backend service

const API_BASE_URL = '/api/ai';

export interface ForecastRequest {
  product_id: string;
  horizon?: number;
  include_confidence?: boolean;
  confidence_level?: number;
  model_type?: 'auto' | 'prophet' | 'sarima' | 'lstm';
}

export interface ForecastResponse {
  product_id: string;
  forecasts: ForecastData[];
  model_used: string;
  accuracy?: number;
  generated_at: string;
}

export interface ForecastData {
  date: string;
  predicted_value: number;
  lower_bound?: number;
  upper_bound?: number;
}

export interface StockoutRequest {
  inventory_item_id: string;
  days_horizon?: number;
}

export interface StockoutResponse {
  inventory_item_id: string;
  predictions: StockoutPrediction[];
  risk_summary: RiskSummary;
  generated_at: string;
}

export interface StockoutPrediction {
  date: string;
  predicted_stock: number;
  stockout_probability: number;
}

export interface RiskSummary {
  current_stock: number;
  consumption_rate: number;
  days_until_stockout?: number;
  probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  lead_time_days: number;
  recommended_order_quantity: number;
  reorder_point: number;
}

export interface OptimizationRequest {
  inventory_item_id: string;
  annual_demand: number;
  unit_cost: number;
  ordering_cost: number;
  holding_cost_rate?: number;
  quantity_discounts?: { min_quantity: number; discount: number }[];
}

export interface OptimizationResponse {
  inventory_item_id: string;
  eoq: number;
  safety_stock: number;
  reorder_point: number;
  optimal_order_quantity: number;
  total_annual_cost: number;
  savings_vs_current?: number;
  recommendations: string[];
  generated_at: string;
}

export interface ProductionScheduleRequest {
  orders: Order[];
  machines: Machine[];
  algorithm?: 'genetic' | 'priority_rules';
  constraints?: Record<string, any>;
}

export interface Order {
  id: string;
  product_id: string;
  quantity: number;
  priority?: number;
  due_date?: string;
}

export interface Machine {
  id: string;
  name: string;
  throughput: number;
  compatible_products?: string[];
}

export interface ProductionScheduleResponse {
  schedules: Schedule[];
  total_conflicts: number;
  utilization: Record<string, number>;
  algorithm_used: string;
  generated_at: string;
}

export interface Schedule {
  order_id: string;
  product_id: string;
  machine_id: string;
  scheduled_start: string;
  scheduled_end: string;
  priority_score: number;
  status: string;
}

// Forecast API
export const forecastApi = {
  generate: async (request: ForecastRequest): Promise<ForecastResponse> => {
    const response = await fetch(`${API_BASE_URL}/forecast/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate forecast');
    }
    
    return response.json();
  },
  
  getHistory: async (productId: string, limit: number = 10): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/forecast/history/${productId}?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch forecast history');
    }
    
    return response.json();
  },
  
  override: async (productId: string, forecastDate: string, manualValue: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/forecast/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        forecast_date: forecastDate,
        manual_value: manualValue,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to apply forecast override');
    }
    
    return response.json();
  },
};

// Stockout Prediction API
export const stockoutApi = {
  predict: async (request: StockoutRequest): Promise<StockoutResponse> => {
    const response = await fetch(`${API_BASE_URL}/stockout/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to predict stockout');
    }
    
    return response.json();
  },
  
  acknowledge: async (predictionId: number, acknowledgedBy: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/stockout/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prediction_id: predictionId,
        acknowledged_by: acknowledgedBy,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to acknowledge stockout');
    }
    
    return response.json();
  },
  
  getPredictions: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/stockout/predictions`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch stockout predictions');
    }
    
    return response.json();
  },
};

// Inventory Optimization API
export const inventoryApi = {
  optimize: async (request: OptimizationRequest): Promise<OptimizationResponse> => {
    const response = await fetch(`${API_BASE_URL}/inventory/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to optimize inventory');
    }
    
    return response.json();
  },
  
  getRecommendations: async (inventoryItemId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/inventory/recommendations/${inventoryItemId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }
    
    return response.json();
  },
  
  getOptimizations: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/inventory/optimizations`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch optimizations');
    }
    
    return response.json();
  },
};

// Production Scheduling API
export const productionApi = {
  schedule: async (request: ProductionScheduleRequest): Promise<ProductionScheduleResponse> => {
    const response = await fetch(`${API_BASE_URL}/production/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate schedule');
    }
    
    return response.json();
  },
  
  getSchedule: async (date: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/production/schedule/${date}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }
    
    return response.json();
  },
  
  getSchedules: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/production/schedules`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules');
    }
    
    return response.json();
  },
};

// Data Extraction API
export const dataApi = {
  extract: async (module: string, entity: string, options?: {
    start_date?: string;
    end_date?: string;
    filters?: Record<string, any>;
  }): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/data/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module,
        entity,
        ...options,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to extract data');
    }
    
    return response.json();
  },
};

// ML Models API
export const mlflowApi = {
  listModels: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/mlflow/models`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch ML models');
    }
    
    return response.json();
  },
};

// Health Check
export const aiHealthCheck = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('AI service is unavailable');
  }
  
  return response.json();
};

export default {
  forecast: forecastApi,
  stockout: stockoutApi,
  inventory: inventoryApi,
  production: productionApi,
  data: dataApi,
  mlflow: mlflowApi,
  healthCheck: aiHealthCheck,
};
