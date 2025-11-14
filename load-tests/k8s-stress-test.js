import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// K8s stress test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users  
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users (should trigger scaling)
    { duration: '1m', target: 150 },  // Spike to 150 users
    { duration: '2m', target: 150 },  // Stay at 150 users (more scaling)
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow higher latency for K8s scaling
    http_req_failed: ['rate<0.10'],    // Allow 10% error rate during scaling
    errors: ['rate<0.10'],
  },
};

// K8s service endpoint (direct LoadBalancer)
const BASE_URL = 'http://127.0.0.1:8050';

export default function () {
  // Focus on the resource-intensive chat endpoint
  const names = ['K8sUser1', 'K8sUser2', 'K8sUser3', 'K8sUser4', 'K8sUser5'];
  const name = names[Math.floor(Math.random() * names.length)];
  
  const response = http.get(`${BASE_URL}/chat?name=${name}`, {
    tags: { endpoint: 'chat', test: 'k8s-stress' },
  });

  const success = check(response, {
    'K8s chat status is 200': (r) => r.status === 200,
    'K8s response contains greeting': (r) => r.body.includes('Hi'),
    'K8s response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);

  // Short think time for stress testing
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds
}

export function handleSummary(data) {
  return {
    'k8s-stress-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  
  return `
${indent}🚢 K8s Stress Test Results
${indent}==========================
${indent}
${indent}🎯 Test Summary:
${indent}  Duration: ${Math.round(data.state.testRunDurationMs/1000)}s
${indent}  Max VUs: ${data.metrics.vus.values.max}
${indent}  Iterations: ${data.metrics.iterations.values.count}
${indent}
${indent}📈 HTTP Metrics:
${indent}  Requests: ${data.metrics.http_reqs.values.count}
${indent}  Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
${indent}  Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
${indent}
${indent}⏱️  Response Times:
${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
${indent}
${indent}🚨 Thresholds:
${indent}  P95 < 2000ms: ${data.metrics.http_req_duration.thresholds['p(95)<2000'].ok ? '✅ PASS' : '❌ FAIL'}
${indent}  Error Rate < 10%: ${data.metrics.http_req_failed.thresholds['rate<0.10'].ok ? '✅ PASS' : '❌ FAIL'}
${indent}
${indent}🚢 K8s Auto-Scaling Expected:
${indent}  - Watch: kubectl get hpa -w
${indent}  - Watch: kubectl get pods -w  
${indent}  - Monitor: kubectl top pods
`;
}
