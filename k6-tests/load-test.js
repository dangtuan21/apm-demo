import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatResponseTime = new Trend('chat_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate must be below 5%
    errors: ['rate<0.05'],            // Custom error rate below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

export default function () {
  // Test chat endpoint
  const chatResponse = http.get(`${BASE_URL}/chat?name=K6User${__VU}`);
  
  check(chatResponse, {
    'chat status is 200': (r) => r.status === 200,
    'chat response contains welcome': (r) => r.body.includes('Welcome'),
    'chat response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(chatResponse.status !== 200);
  chatResponseTime.add(chatResponse.timings.duration);

  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response contains OK': (r) => r.body.includes('OK'),
  });

  errorRate.add(healthResponse.status !== 200);

  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}
