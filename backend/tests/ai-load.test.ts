// AI Module Load Testing Script
// Uses k6 for performance testing

import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up
    { duration: '1m', target: 50 },    // Steady load
    { duration: '30s', target: 100 },  // Stress
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% requests < 500ms
    http_req_failed: ['rate<0.1'],     // Error rate < 10%
  },
};

const BASE_URL = __ENV.AI_API_URL || 'http://localhost:5000';

// Test scenarios
export default function () {
  // Test 1: Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status 200': (r) => r.status === 200,
  });

  // Test 2: Generate forecast
  const forecastRes = http.post(
    `${BASE_URL}/forecast/generate`,
    JSON.stringify({
      product_id: `PROD-${Math.floor(Math.random() * 100)}`,
      horizon: 12,
      model_type: 'auto',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(forecastRes, {
    'forecast status 200': (r) => r.status === 200,
    'forecast has data': (r) => r.json('forecasts') !== undefined,
  });

  // Test 3: Stockout prediction
  const stockoutRes = http.post(
    `${BASE_URL}/stockout/predict`,
    JSON.stringify({
      inventory_item_id: `ITEM-${Math.floor(Math.random() * 100)}`,
      days_horizon: 30,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(stockoutRes, {
    'stockout status 200': (r) => r.status === 200,
    'stockout has risk': (r) => r.json('risk_summary') !== undefined,
  });

  // Test 4: Inventory optimization
  const optimizeRes = http.post(
    `${BASE_URL}/inventory/optimize`,
    JSON.stringify({
      inventory_item_id: `ITEM-${Math.floor(Math.random() * 100)}`,
      annual_demand: 10000,
      unit_cost: 50,
      ordering_cost: 100,
      holding_cost_rate: 0.25,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(optimizeRes, {
    'optimization status 200': (r) => r.status === 200,
    'optimization has eoq': (r) => r.json('eoq') !== undefined,
  });

  // Test 5: Production schedule
  const scheduleRes = http.post(
    `${BASE_URL}/production/schedule`,
    JSON.stringify({
      orders: [
        { id: 'ORD-001', product_id: 'PROD-A', quantity: 100, priority: 1 },
        { id: 'ORD-002', product_id: 'PROD-B', quantity: 150, priority: 2 },
      ],
      machines: [
        { id: 'MACH-001', name: 'Press A', throughput: 100 },
      ],
      algorithm: 'genetic',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(scheduleRes, {
    'schedule status 200': (r) => r.status === 200,
    'schedule has schedules': (r) => r.json('schedules') !== undefined,
  });

  sleep(1);
}

// Summary handler
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    './tests/ai-load-summary.json': JSON.stringify(data),
  };
}

// Simple text summary
function textSummary(data, opts) {
  const indent = opts.indent || '';
  let output = `${indent}AI Module Load Test Results\n`;
  output += `${indent============================\n\n`;
  
  if (data.metrics.http_req_duration) {
    output += `${indent}Response Time:\n`;
    output += `${indent}  avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    output += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    output += `${indent}  max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }
  
  if (data.metrics.http_reqs) {
    output += `${indent}Throughput:\n`;
    output += `${indent}  total: ${data.metrics.http_reqs.values.count}\n`;
    output += `${indent}  rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }
  
  if (data.metrics.http_req_failed) {
    output += `${indent}Errors:\n`;
    output += `${indent}  failed: ${data.metrics.http_req_failed.values.passes}\n`;
    output += `${indent}  rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }
  
  return output;
}
