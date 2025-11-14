import http from 'k6/http';
import { check, sleep } from 'k6';

// Spike test - Sudden traffic spikes
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 100 },  // Sudden spike!
    { duration: '30s', target: 100 },  // Stay at spike
    { duration: '10s', target: 10 },   // Back to normal
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 200 },  // Even bigger spike!
    { duration: '20s', target: 200 },  // Stay at big spike
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow high latency during spikes
    http_req_failed: ['rate<0.15'],    // Allow 15% error rate during spikes
  },
};

const BASE_URL = 'http://localhost:8050';

export default function () {
  // Mix of endpoints during spike
  const endpoints = [
    () => http.get(`${BASE_URL}/chat?name=SpikeUser${Math.floor(Math.random() * 100)}`),
    () => http.get(`${BASE_URL}/health`),
    () => http.post(`${BASE_URL}/logout`, {}),
  ];

  const response = endpoints[Math.floor(Math.random() * endpoints.length)]();

  check(response, {
    'status is not 500': (r) => r.status !== 500,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(Math.random() * 0.5); // Very short think time
}

export function handleSummary(data) {
  return {
    'spike-test-results.json': JSON.stringify(data, null, 2),
  };
}
