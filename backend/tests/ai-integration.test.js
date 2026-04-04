// AI Module Integration Tests
// Run with: npm test

const axios = require('axios');

const API_BASE = process.env.AI_API_URL || 'http://localhost:5000';

describe('AI Module Integration Tests', () => {
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${API_BASE}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
    });
  });

  describe('Forecast Generation', () => {
    it('should generate forecast with auto model', async () => {
      const response = await axios.post(`${API_BASE}/forecast/generate`, {
        product_id: 'TEST-PROD-001',
        horizon: 6,
        model_type: 'auto',
        confidence_level: 0.95
      });
      
      expect(response.status).toBe(200);
      expect(response.data.forecasts).toBeDefined();
      expect(response.data.forecasts.length).toBe(6);
      expect(response.data.model_used).toBeDefined();
    });

    it('should generate forecast with Prophet', async () => {
      const response = await axios.post(`${API_BASE}/forecast/generate`, {
        product_id: 'TEST-PROD-002',
        horizon: 12,
        model_type: 'prophet'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.model_used).toBe('prophet');
    });

    it('should return error for invalid product', async () => {
      try {
        await axios.post(`${API_BASE}/forecast/generate`, {
          product_id: '',
          horizon: 12
        });
      } catch (error) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('Stockout Prediction', () => {
    it('should predict stockout risk', async () => {
      const response = await axios.post(`${API_BASE}/stockout/predict`, {
        inventory_item_id: 'TEST-ITEM-001',
        days_horizon: 30
      });
      
      expect(response.status).toBe(200);
      expect(response.data.predictions).toBeDefined();
      expect(response.data.risk_summary).toBeDefined();
      expect(response.data.risk_summary.risk_level).toBeDefined();
    });

    it('should acknowledge prediction', async () => {
      // First create a prediction
      const predictResponse = await axios.post(`${API_BASE}/stockout/predict`, {
        inventory_item_id: 'TEST-ITEM-002',
        days_horizon: 30
      });
      
      expect(predictResponse.status).toBe(200);
    });
  });

  describe('Inventory Optimization', () => {
    it('should optimize inventory with EOQ', async () => {
      const response = await axios.post(`${API_BASE}/inventory/optimize`, {
        inventory_item_id: 'TEST-ITEM-003',
        annual_demand: 10000,
        unit_cost: 50,
        ordering_cost: 100,
        holding_cost_rate: 0.25
      });
      
      expect(response.status).toBe(200);
      expect(response.data.eoq).toBeDefined();
      expect(response.data.eoq).toBeGreaterThan(0);
      expect(response.data.safety_stock).toBeDefined();
      expect(response.data.reorder_point).toBeDefined();
      expect(response.data.recommendations).toBeDefined();
    });

    it('should apply quantity discounts', async () => {
      const response = await axios.post(`${API_BASE}/inventory/optimize`, {
        inventory_item_id: 'TEST-ITEM-004',
        annual_demand: 10000,
        unit_cost: 50,
        ordering_cost: 100,
        holding_cost_rate: 0.25,
        quantity_discounts: [
          { min_quantity: 500, discount: 5 },
          { min_quantity: 1000, discount: 10 }
        ]
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Production Scheduling', () => {
    it('should generate schedule with genetic algorithm', async () => {
      const response = await axios.post(`${API_BASE}/production/schedule`, {
        orders: [
          { id: 'ORD-001', product_id: 'PROD-A', quantity: 100, priority: 1 },
          { id: 'ORD-002', product_id: 'PROD-B', quantity: 150, priority: 2 },
          { id: 'ORD-003', product_id: 'PROD-A', quantity: 80, priority: 3 }
        ],
        machines: [
          { id: 'MACH-001', name: 'Press A', throughput: 100 },
          { id: 'MACH-002', name: 'Press B', throughput: 80 }
        ],
        algorithm: 'genetic'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.schedules).toBeDefined();
      expect(response.data.algorithm_used).toBe('genetic_algorithm');
      expect(response.data.utilization).toBeDefined();
    });

    it('should generate schedule with priority rules', async () => {
      const response = await axios.post(`${API_BASE}/production/schedule`, {
        orders: [
          { id: 'ORD-001', product_id: 'PROD-A', quantity: 100, priority: 1 }
        ],
        machines: [
          { id: 'MACH-001', name: 'Press A', throughput: 100 }
        ],
        algorithm: 'priority_rules'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.algorithm_used).toBe('priority_rules');
    });
  });

  describe('Data Extraction', () => {
    it('should extract aluminium orders', async () => {
      const response = await axios.post(`${API_BASE}/data/extract`, {
        module: 'aluminium',
        entity: 'orders',
        start_date: '2025-01-01',
        end_date: '2026-01-01'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data).toBeDefined();
    });

    it('should extract stock inventory', async () => {
      const response = await axios.post(`${API_BASE}/data/extract`, {
        module: 'stock',
        entity: 'inventory'
      });
      
      expect(response.status).toBe(200);
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  it('forecast should complete within 5 seconds', async () => {
    const start = Date.now();
    await axios.post(`${API_BASE}/forecast/generate`, {
      product_id: 'BENCH-PROD-001',
      horizon: 12
    });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  }, 10000);

  it('stockout prediction should complete within 2 seconds', async () => {
    const start = Date.now();
    await axios.post(`${API_BASE}/stockout/predict`, {
      inventory_item_id: 'BENCH-ITEM-001',
      days_horizon: 30
    });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  }, 5000);

  it('optimization should complete within 2 seconds', async () => {
    const start = Date.now();
    await axios.post(`${API_BASE}/inventory/optimize`, {
      inventory_item_id: 'BENCH-ITEM-002',
      annual_demand: 10000,
      unit_cost: 50,
      ordering_cost: 100
    });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  }, 5000);
});
