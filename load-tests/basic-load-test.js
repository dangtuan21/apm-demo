import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate must be below 5%
    errors: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:8050';

export default function () {
  // Test different endpoints
  const scenarios = [
    () => testChatEndpoint(),
    () => testHealthEndpoint(),
    () => testMetricsEndpoint(),
    () => testLoginLogout(),
  ];

  // Randomly pick a scenario (weighted)
  const weights = [0.6, 0.2, 0.1, 0.1]; // 60% chat, 20% health, 10% metrics, 10% login/logout
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      scenarios[i]();
      break;
    }
  }

  // Think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function testChatEndpoint() {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  const name = names[Math.floor(Math.random() * names.length)];
  
  const response = http.get(`${BASE_URL}/chat?name=${name}`, {
    tags: { endpoint: 'chat' },
  });

  const success = check(response, {
    'chat status is 200': (r) => r.status === 200,
    'chat response contains greeting': (r) => r.body.includes('Hello'),
    'chat response time < 200ms': (r) => r.timings.duration < 200,
  });

  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testHealthEndpoint() {
  const response = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: 'health' },
  });

  const success = check(response, {
    'health status is 200': (r) => r.status === 200,
    'health response contains status': (r) => r.body.includes('OK'),
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testMetricsEndpoint() {
  const response = http.get(`${BASE_URL}/metrics`, {
    tags: { endpoint: 'metrics' },
  });

  const success = check(response, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response contains prometheus data': (r) => r.body.includes('http_requests_total'),
  });

  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testLoginLogout() {
  // Simulate login
  const loginResponse = http.get(`${BASE_URL}/chat?name=TestUser`, {
    tags: { endpoint: 'login' },
  });

  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
  });

  // Small delay
  sleep(0.5);

  // Simulate logout
  const logoutResponse = http.post(`${BASE_URL}/logout`, {}, {
    tags: { endpoint: 'logout' },
  });

  const logoutSuccess = check(logoutResponse, {
    'logout status is 200': (r) => r.status === 200,
  });

  errorRate.add(!(loginSuccess && logoutSuccess));
  responseTime.add(loginResponse.timings.duration + logoutResponse.timings.duration);
  requestCount.add(2);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  return `
${indent}📊 K6 Load Test Results
${indent}========================
${indent}
${indent}🎯 Test Summary:
${indent}  Duration: ${data.state.testRunDurationMs}ms
${indent}  VUs: ${data.metrics.vus.values.max}
${indent}  Iterations: ${data.metrics.iterations.values.count}
${indent}
${indent}📈 HTTP Metrics:
${indent}  Requests: ${data.metrics.http_reqs.values.count}
${indent}  Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
${indent}  Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%
${indent}
${indent}⏱️  Response Times:
${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
${indent}
${indent}🚨 Thresholds:
${indent}  P95 < 500ms: ${data.metrics.http_req_duration.thresholds['p(95)<500'].ok ? '✅ PASS' : '❌ FAIL'}
${indent}  Error Rate < 5%: ${data.metrics.http_req_failed.thresholds['rate<0.05'].ok ? '✅ PASS' : '❌ FAIL'}
`;
}
