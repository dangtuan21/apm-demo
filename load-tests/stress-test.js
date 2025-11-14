import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress test configuration - Push the system to its limits
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users (stress)
    { duration: '1m', target: 300 },  // Spike to 300 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Allow higher latency under stress
    http_req_failed: ['rate<0.10'],    // Allow 10% error rate under stress
  },
};

const BASE_URL = 'http://localhost:8050';

export default function () {
  // Heavy load on chat endpoint
  const names = ['User1', 'User2', 'User3', 'User4', 'User5'];
  const name = names[Math.floor(Math.random() * names.length)];
  
  const response = http.get(`${BASE_URL}/chat?name=${name}`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  // Minimal think time for stress
  sleep(0.1);
}

export function handleSummary(data) {
  return {
    'stress-test-results.json': JSON.stringify(data, null, 2),
  };
}
