import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for endurance testing
const errorRate = new Rate('errors');
const memoryLeakIndicator = new Trend('response_time_trend');

// Endurance test - long duration with moderate load
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp up
    { duration: '30m', target: 20 },  // Long steady load
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],     // Performance shouldn't degrade
    http_req_failed: ['rate<0.02'],       // Very low error rate
    response_time_trend: ['p(95)<1000'],  // Check for memory leaks
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

export default function () {
  // Simulate realistic user session
  const sessionId = `session_${__VU}_${Math.floor(__ITER / 10)}`;
  
  // Chat request with session simulation
  const chatResponse = http.get(`${BASE_URL}/chat?name=EnduranceUser_${sessionId}`);
  
  check(chatResponse, {
    'chat status is 200': (r) => r.status === 200,
    'no performance degradation': (r) => r.timings.duration < 1000,
    'response contains expected content': (r) => r.body.includes('Welcome'),
  });
  
  errorRate.add(chatResponse.status !== 200);
  memoryLeakIndicator.add(chatResponse.timings.duration);
  
  // Periodic health check
  if (__ITER % 10 === 0) {
    const healthResponse = http.get(`${BASE_URL}/health`);
    check(healthResponse, {
      'health check passes': (r) => r.status === 200,
    });
  }
  
  // Realistic user think time
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}
