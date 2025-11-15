import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const userJourneySuccess = new Rate('user_journey_success');
const chatResponseTime = new Trend('chat_response_time');
const errorsByType = new Counter('errors_by_type');
const businessTransactions = new Counter('business_transactions');

// Advanced scenario configuration
export const options = {
  scenarios: {
    // Scenario 1: Normal user behavior (70% of traffic)
    normal_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '10m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'normalUserJourney',
    },

    // Scenario 2: Power users with heavy usage (20% of traffic)
    power_users: {
      executor: 'constant-vus',
      vus: 5,
      duration: '14m',
      exec: 'powerUserJourney',
      startTime: '30s', // Start after normal users
    },

    // Scenario 3: API automation/bots (10% of traffic)
    api_bots: {
      executor: 'constant-arrival-rate',
      rate: 10, // 10 requests per second
      timeUnit: '1s',
      duration: '12m',
      preAllocatedVUs: 3,
      maxVUs: 10,
      exec: 'apiBotBehavior',
      startTime: '1m',
    },

    // Scenario 4: Spike traffic during peak hours
    peak_hour_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      stages: [
        { duration: '1m', target: 50 }, // Sudden spike
        { duration: '2m', target: 50 }, // Maintain spike
        { duration: '1m', target: 0 },  // Drop back
      ],
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: 'spikeTraffic',
      startTime: '8m', // Spike in the middle of test
    },

    // Scenario 5: Background health checks
    health_monitors: {
      executor: 'constant-arrival-rate',
      rate: 1, // 1 health check per second
      timeUnit: '1s',
      duration: '14m',
      preAllocatedVUs: 1,
      maxVUs: 2,
      exec: 'healthMonitoring',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% under 1s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    user_journey_success: ['rate>0.95'], // 95% successful journeys
    'http_req_duration{scenario:normal_users}': ['p(95)<500'],
    'http_req_duration{scenario:power_users}': ['p(95)<800'],
    'http_req_duration{scenario:api_bots}': ['p(95)<200'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

// Scenario 1: Normal User Journey
export function normalUserJourney() {
  const userName = `NormalUser_${__VU}_${randomString(5)}`;
  
  group('Normal User Session', function() {
    // 1. Health check (users sometimes check if service is up)
    if (Math.random() < 0.1) { // 10% chance
      group('Health Check', function() {
        const healthRes = http.get(`${BASE_URL}/health`);
        check(healthRes, { 'health check ok': (r) => r.status === 200 });
      });
    }

    // 2. Main chat interaction
    group('Chat Interaction', function() {
      const chatRes = http.get(`${BASE_URL}/chat?name=${userName}`);
      const success = check(chatRes, {
        'chat status 200': (r) => r.status === 200,
        'chat has welcome message': (r) => r.body.includes('Welcome'),
        'chat response time ok': (r) => r.timings.duration < 1000,
      });
      
      chatResponseTime.add(chatRes.timings.duration);
      userJourneySuccess.add(success);
      businessTransactions.add(1, { type: 'chat_interaction' });
      
      if (!success) {
        errorsByType.add(1, { error_type: 'chat_failure', scenario: 'normal_users' });
      }
    });

    // 3. Think time (realistic user behavior)
    sleep(randomIntBetween(2, 8)); // 2-8 seconds think time
  });
}

// Scenario 2: Power User Journey
export function powerUserJourney() {
  const powerUser = `PowerUser_${__VU}_${randomString(3)}`;
  
  group('Power User Session', function() {
    // Power users make multiple rapid requests
    for (let i = 0; i < randomIntBetween(3, 7); i++) {
      group(`Chat Request ${i + 1}`, function() {
        const chatRes = http.get(`${BASE_URL}/chat?name=${powerUser}_req${i}`);
        const success = check(chatRes, {
          'power user chat ok': (r) => r.status === 200,
          'power user response time': (r) => r.timings.duration < 1500,
        });
        
        chatResponseTime.add(chatRes.timings.duration);
        businessTransactions.add(1, { type: 'power_user_chat' });
        
        if (!success) {
          errorsByType.add(1, { error_type: 'power_user_failure', scenario: 'power_users' });
        }
      });
      
      sleep(randomIntBetween(1, 3)); // Shorter think time for power users
    }
  });
}

// Scenario 3: API Bot Behavior
export function apiBotBehavior() {
  const botId = `Bot_${__VU}_${Date.now()}`;
  
  group('API Bot Requests', function() {
    // Bots typically make very fast, consistent requests
    const botRes = http.get(`${BASE_URL}/chat?name=${botId}`, {
      headers: {
        'User-Agent': 'APM-Bot/1.0',
        'X-Bot-Type': 'monitoring',
      },
    });
    
    const success = check(botRes, {
      'bot request successful': (r) => r.status === 200,
      'bot response very fast': (r) => r.timings.duration < 500,
    });
    
    businessTransactions.add(1, { type: 'bot_request' });
    
    if (!success) {
      errorsByType.add(1, { error_type: 'bot_failure', scenario: 'api_bots' });
    }
  });
  
  // Bots don't have think time
}

// Scenario 4: Spike Traffic
export function spikeTraffic() {
  const spikeUser = `SpikeUser_${__VU}_${randomString(4)}`;
  
  group('Spike Traffic Request', function() {
    const spikeRes = http.get(`${BASE_URL}/chat?name=${spikeUser}`);
    const success = check(spikeRes, {
      'spike request handled': (r) => r.status === 200,
      'spike response acceptable': (r) => r.timings.duration < 2000, // More lenient during spikes
    });
    
    businessTransactions.add(1, { type: 'spike_traffic' });
    
    if (!success) {
      errorsByType.add(1, { error_type: 'spike_failure', scenario: 'peak_hour_spike' });
    }
  });
  
  sleep(0.5); // Very short sleep during spike
}

// Scenario 5: Health Monitoring
export function healthMonitoring() {
  group('Health Monitoring', function() {
    const healthRes = http.get(`${BASE_URL}/health`);
    const metricsRes = http.get(`${BASE_URL}/metrics`);
    
    check(healthRes, {
      'health endpoint available': (r) => r.status === 200,
      'health response fast': (r) => r.timings.duration < 100,
    });
    
    check(metricsRes, {
      'metrics endpoint available': (r) => r.status === 200,
      'metrics contain data': (r) => r.body.includes('http_requests_total'),
    });
    
    businessTransactions.add(1, { type: 'health_check' });
  });
}
