import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Chaos testing metrics
const systemResilience = new Rate('system_resilience');
const recoveryTime = new Trend('recovery_time');
const chaosEvents = new Counter('chaos_events');
const serviceAvailability = new Rate('service_availability');

// Chaos testing scenarios
export const options = {
  scenarios: {
    // Normal baseline traffic
    baseline_traffic: {
      executor: 'constant-vus',
      vus: 10,
      duration: '15m',
      exec: 'baselineTraffic',
    },

    // Intermittent chaos events
    chaos_injection: {
      executor: 'constant-arrival-rate',
      rate: 1, // 1 chaos event per second
      timeUnit: '1s',
      duration: '15m',
      preAllocatedVUs: 2,
      maxVUs: 5,
      exec: 'chaosInjection',
      startTime: '2m', // Start chaos after baseline is established
    },

    // Recovery validation
    recovery_validation: {
      executor: 'constant-arrival-rate',
      rate: 5, // 5 recovery checks per second
      timeUnit: '1s',
      duration: '13m',
      preAllocatedVUs: 3,
      maxVUs: 8,
      exec: 'recoveryValidation',
      startTime: '2m',
    },
  },
  thresholds: {
    system_resilience: ['rate>0.80'],        // 80% resilience during chaos
    service_availability: ['rate>0.95'],     // 95% availability overall
    recovery_time: ['p(95)<5000'],           // 95% recover within 5s
    'http_req_duration{scenario:baseline_traffic}': ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

// Baseline traffic to measure normal behavior
export function baselineTraffic() {
  const userId = `baseline_user_${__VU}_${randomString(4)}`;
  
  group('Baseline Traffic', function() {
    const res = http.get(`${BASE_URL}/chat?name=${userId}`, {
      timeout: '10s', // Longer timeout during chaos testing
    });
    
    const available = check(res, {
      'service available': (r) => r.status === 200,
      'response time acceptable': (r) => r.timings.duration < 2000,
      'response contains data': (r) => r.body.includes('Welcome'),
    });
    
    serviceAvailability.add(available);
    
    if (available) {
      systemResilience.add(1);
    } else {
      systemResilience.add(0);
      chaosEvents.add(1, { type: 'service_degradation' });
    }
  });
  
  sleep(randomIntBetween(1, 3));
}

// Chaos injection - simulate various failure scenarios
export function chaosInjection() {
  const chaosType = Math.random();
  
  group('Chaos Injection', function() {
    
    if (chaosType < 0.3) {
      // 30% - Network latency simulation (slow requests)
      group('Network Latency Chaos', function() {
        const slowRes = http.get(`${BASE_URL}/chat?name=chaos_slow_${randomString(4)}`, {
          timeout: '15s',
        });
        
        chaosEvents.add(1, { type: 'network_latency' });
        
        if (slowRes.timings.duration > 5000) {
          console.log(`🐌 Slow response detected: ${slowRes.timings.duration}ms`);
        }
      });
      
    } else if (chaosType < 0.5) {
      // 20% - Invalid requests (malformed data)
      group('Invalid Request Chaos', function() {
        const invalidRes = http.get(`${BASE_URL}/chat?name=${randomString(1000)}`, { // Very long name
          timeout: '10s',
        });
        
        chaosEvents.add(1, { type: 'invalid_request' });
        
        check(invalidRes, {
          'handles invalid request gracefully': (r) => r.status >= 400 && r.status < 500,
        });
      });
      
    } else if (chaosType < 0.7) {
      // 20% - Rapid fire requests (burst traffic)
      group('Burst Traffic Chaos', function() {
        const burstSize = randomIntBetween(10, 30);
        let burstSuccess = 0;
        
        for (let i = 0; i < burstSize; i++) {
          const burstRes = http.get(`${BASE_URL}/chat?name=burst_${i}_${randomString(3)}`, {
            timeout: '5s',
          });
          
          if (burstRes.status === 200) {
            burstSuccess++;
          }
        }
        
        chaosEvents.add(1, { type: 'burst_traffic' });
        
        const burstSuccessRate = burstSuccess / burstSize;
        systemResilience.add(burstSuccessRate);
        
        console.log(`💥 Burst test: ${burstSuccess}/${burstSize} requests succeeded`);
      });
      
    } else {
      // 30% - Connection chaos (abrupt disconnections)
      group('Connection Chaos', function() {
        const connectionRes = http.get(`${BASE_URL}/chat?name=connection_chaos_${randomString(4)}`, {
          timeout: '2s', // Very short timeout to simulate connection issues
        });
        
        chaosEvents.add(1, { type: 'connection_chaos' });
        
        if (connectionRes.error) {
          console.log(`🔌 Connection chaos triggered: ${connectionRes.error}`);
        }
      });
    }
  });
  
  sleep(randomIntBetween(1, 5)); // Variable chaos intervals
}

// Recovery validation - check how quickly system recovers
export function recoveryValidation() {
  const validationId = `recovery_${__VU}_${Date.now()}`;
  const startTime = Date.now();
  
  group('Recovery Validation', function() {
    
    // Quick health check
    const healthRes = http.get(`${BASE_URL}/health`, {
      timeout: '3s',
    });
    
    const healthOk = check(healthRes, {
      'health endpoint responsive': (r) => r.status === 200,
      'health response fast': (r) => r.timings.duration < 1000,
    });
    
    if (healthOk) {
      // If health is OK, test main functionality
      const funcRes = http.get(`${BASE_URL}/chat?name=${validationId}`, {
        timeout: '5s',
      });
      
      const funcOk = check(funcRes, {
        'main function works': (r) => r.status === 200,
        'main function response time': (r) => r.timings.duration < 2000,
        'main function returns data': (r) => r.body.includes('Welcome'),
      });
      
      if (funcOk) {
        const recoveryTimeMs = Date.now() - startTime;
        recoveryTime.add(recoveryTimeMs);
        systemResilience.add(1);
      } else {
        systemResilience.add(0);
        console.log(`🚨 Recovery validation failed for main function`);
      }
      
    } else {
      systemResilience.add(0);
      console.log(`🚨 Recovery validation failed for health check`);
    }
    
    serviceAvailability.add(healthOk);
  });
  
  sleep(0.2); // Fast recovery checks
}
