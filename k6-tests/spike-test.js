import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Spike test configuration - sudden traffic spikes
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 200 },  // Sudden spike!
    { duration: '30s', target: 200 },  // Maintain spike
    { duration: '10s', target: 10 },   // Drop back to normal
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 500 },  // Massive spike!
    { duration: '20s', target: 500 },  // Maintain massive spike
    { duration: '10s', target: 0 },    // Complete drop
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow higher latency during spikes
    http_req_failed: ['rate<0.15'],    // Allow 15% error rate during spikes
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

export default function () {
  // Mix of requests during spike
  const requests = [
    { url: `${BASE_URL}/chat?name=SpikeUser${__VU}`, weight: 0.8 },
    { url: `${BASE_URL}/health`, weight: 0.2 },
  ];
  
  const selectedRequest = requests[Math.random() < 0.8 ? 0 : 1];
  const response = http.get(selectedRequest.url);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable during spike': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  
  // Very short sleep during spike test
  sleep(0.1);
}
