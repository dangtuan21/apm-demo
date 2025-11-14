import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatResponseTime = new Trend('chat_response_time');
const requestCount = new Counter('total_requests');

// Stress test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 200 },  // Ramp up to 200 users (stress)
    { duration: '2m', target: 300 },  // Ramp up to 300 users (breaking point)
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% under 1s during stress
    http_req_failed: ['rate<0.10'],    // Allow 10% error rate during stress
    errors: ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

export default function () {
  requestCount.add(1);
  
  // Simulate different user behaviors
  const userBehavior = Math.random();
  
  if (userBehavior < 0.7) {
    // 70% - Normal chat requests
    const chatResponse = http.get(`${BASE_URL}/chat?name=StressUser${__VU}_${__ITER}`);
    
    check(chatResponse, {
      'chat status is 200': (r) => r.status === 200,
      'chat response time acceptable': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(chatResponse.status !== 200);
    chatResponseTime.add(chatResponse.timings.duration);
    
  } else if (userBehavior < 0.9) {
    // 20% - Health checks
    const healthResponse = http.get(`${BASE_URL}/health`);
    
    check(healthResponse, {
      'health status is 200': (r) => r.status === 200,
    });
    
    errorRate.add(healthResponse.status !== 200);
    
  } else {
    // 10% - Invalid requests (to test error handling)
    const errorResponse = http.get(`${BASE_URL}/invalid-endpoint-${__VU}`);
    
    check(errorResponse, {
      'error status is 404': (r) => r.status === 404,
    });
    
    // Don't count 404s as errors since they're expected
  }

  // Shorter sleep during stress test
  sleep(Math.random() * 0.5 + 0.1);
}
