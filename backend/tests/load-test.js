import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up
    { duration: '1m', target: 50 },    // Steady load
    { duration: '30s', target: 100 },  // Stress test
    { duration: '1m', target: 50 },    // Cool down
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Authentication token
let authToken = '';

export function setup() {
  // Login and get token
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, {
    email: 'admin@erp.local',
    password: 'admin123',
  });

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    authToken = body.data?.accessToken || '';
  }

  return { authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.authToken}`,
  };

  // Test 1: Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Test 2: Get users (if authenticated)
  if (data.authToken) {
    const usersRes = http.get(`${BASE_URL}/api/v1/users`, { headers });
    check(usersRes, {
      'users list status is 200': (r) => r.status === 200,
      'users list has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success && body.data;
        } catch {
          return false;
        }
      },
    });
    if (usersRes.status !== 200) {
      errorRate.add(1);
    }

    // Test 3: Get profiles
    const profilesRes = http.get(`${BASE_URL}/api/v1/profiles`, { headers });
    check(profilesRes, {
      'profiles status is 200': (r) => r.status === 200,
    });

    // Test 4: Get quotes
    const quotesRes = http.get(`${BASE_URL}/api/v1/quotes`, { headers });
    check(quotesRes, {
      'quotes status is 200': (r) => r.status === 200,
    });

    // Test 5: Get stock items
    const stockRes = http.get(`${BASE_URL}/api/v1/stock/items`, { headers });
    check(stockRes, {
      'stock items status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

// Text summary formatter
function textSummary(data, opts) {
  const indent = opts.indent || '';
  let output = `\n${indent}Test Summary:\n`;
  output += `${indent}===========\n\n`;
  output += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  output += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  output += `${indent}Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  output += `${indent}p95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  output += `${indent}Avg Throughput: ${data.metrics.http_reqs.values.rates['1'].toFixed(2)}/s\n`;
  
  return output;
}
