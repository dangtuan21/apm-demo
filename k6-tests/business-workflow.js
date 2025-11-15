import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Business-specific metrics
const customerJourneySuccess = new Rate('customer_journey_success');
const conversionRate = new Rate('conversion_rate');
const abandonmentRate = new Rate('abandonment_rate');
const sessionDuration = new Trend('session_duration');
const businessValue = new Counter('business_value_generated');

// Business workflow scenario
export const options = {
  scenarios: {
    // Customer onboarding flow
    customer_onboarding: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '5m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      exec: 'customerOnboardingFlow',
    },

    // Existing customer usage
    existing_customers: {
      executor: 'constant-vus',
      vus: 10,
      duration: '7m',
      exec: 'existingCustomerFlow',
    },

    // Support/help requests
    support_requests: {
      executor: 'constant-arrival-rate',
      rate: 2, // 2 support requests per second
      timeUnit: '1s',
      duration: '7m',
      preAllocatedVUs: 2,
      maxVUs: 5,
      exec: 'supportRequestFlow',
    },
  },
  thresholds: {
    customer_journey_success: ['rate>0.90'], // 90% successful customer journeys
    conversion_rate: ['rate>0.15'],          // 15% conversion rate
    abandonment_rate: ['rate<0.20'],         // Less than 20% abandonment
    session_duration: ['p(50)>30000'],       // Median session > 30 seconds
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

// Customer Onboarding Flow
export function customerOnboardingFlow() {
  const customerId = `new_customer_${randomString(8)}`;
  const sessionStart = Date.now();
  let journeySuccess = true;
  let converted = false;
  let abandoned = false;

  group('Customer Onboarding Journey', function() {
    
    // Step 1: Landing page health check
    group('1. Landing Page', function() {
      const healthRes = http.get(`${BASE_URL}/health`);
      if (!check(healthRes, { 'landing page loads': (r) => r.status === 200 })) {
        journeySuccess = false;
        abandoned = true;
        return;
      }
      sleep(randomIntBetween(2, 5)); // Read landing page
    });

    if (abandoned) return;

    // Step 2: First interaction (trial)
    group('2. Trial Interaction', function() {
      const trialRes = http.get(`${BASE_URL}/chat?name=${customerId}_trial`);
      if (!check(trialRes, { 
        'trial works': (r) => r.status === 200,
        'trial response time good': (r) => r.timings.duration < 1000 
      })) {
        journeySuccess = false;
        // 70% abandon after failed trial
        if (Math.random() < 0.7) {
          abandoned = true;
          return;
        }
      }
      sleep(randomIntBetween(3, 8)); // Evaluate trial results
    });

    if (abandoned) return;

    // Step 3: Multiple feature exploration
    group('3. Feature Exploration', function() {
      const features = ['basic', 'advanced', 'premium'];
      
      for (let i = 0; i < randomIntBetween(2, 4); i++) {
        const feature = features[Math.floor(Math.random() * features.length)];
        const featureRes = http.get(`${BASE_URL}/chat?name=${customerId}_${feature}`);
        
        check(featureRes, { 
          [`${feature} feature works`]: (r) => r.status === 200 
        });
        
        sleep(randomIntBetween(2, 6)); // Explore feature
        
        // Chance to abandon during exploration
        if (Math.random() < 0.1) { // 10% abandon chance per feature
          abandoned = true;
          break;
        }
      }
    });

    if (abandoned) return;

    // Step 4: Conversion decision
    group('4. Conversion Decision', function() {
      // Simulate conversion decision based on experience
      const conversionChance = journeySuccess ? 0.25 : 0.05; // 25% if good experience, 5% if poor
      
      if (Math.random() < conversionChance) {
        converted = true;
        businessValue.add(100, { type: 'new_customer_conversion' });
        
        // Converted users do one more interaction
        const convertedRes = http.get(`${BASE_URL}/chat?name=${customerId}_converted`);
        check(convertedRes, { 'post-conversion interaction': (r) => r.status === 200 });
      }
      
      sleep(randomIntBetween(1, 3)); // Decision time
    });
  });

  // Record metrics
  const sessionEnd = Date.now();
  sessionDuration.add(sessionEnd - sessionStart);
  customerJourneySuccess.add(journeySuccess);
  conversionRate.add(converted);
  abandonmentRate.add(abandoned);
}

// Existing Customer Flow
export function existingCustomerFlow() {
  const customerId = `existing_customer_${__VU}_${randomString(5)}`;
  
  group('Existing Customer Session', function() {
    
    // Existing customers have established patterns
    const sessionType = Math.random();
    
    if (sessionType < 0.6) {
      // 60% - Regular usage pattern
      group('Regular Usage', function() {
        for (let i = 0; i < randomIntBetween(3, 8); i++) {
          const res = http.get(`${BASE_URL}/chat?name=${customerId}_regular_${i}`);
          check(res, { 'regular usage works': (r) => r.status === 200 });
          businessValue.add(10, { type: 'regular_usage' });
          sleep(randomIntBetween(1, 4));
        }
      });
      
    } else if (sessionType < 0.9) {
      // 30% - Heavy usage pattern
      group('Heavy Usage', function() {
        for (let i = 0; i < randomIntBetween(10, 20); i++) {
          const res = http.get(`${BASE_URL}/chat?name=${customerId}_heavy_${i}`);
          check(res, { 'heavy usage works': (r) => r.status === 200 });
          businessValue.add(5, { type: 'heavy_usage' });
          sleep(randomIntBetween(0.5, 2));
        }
      });
      
    } else {
      // 10% - Premium feature usage
      group('Premium Usage', function() {
        for (let i = 0; i < randomIntBetween(2, 5); i++) {
          const res = http.get(`${BASE_URL}/chat?name=${customerId}_premium_${i}`);
          check(res, { 'premium usage works': (r) => r.status === 200 });
          businessValue.add(50, { type: 'premium_usage' });
          sleep(randomIntBetween(2, 6));
        }
      });
    }
  });
}

// Support Request Flow
export function supportRequestFlow() {
  const ticketId = `support_${randomString(6)}`;
  
  group('Support Request', function() {
    
    // Support requests often start with health checks
    group('Support Diagnostics', function() {
      const healthRes = http.get(`${BASE_URL}/health`);
      const metricsRes = http.get(`${BASE_URL}/metrics`);
      
      check(healthRes, { 'support health check': (r) => r.status === 200 });
      check(metricsRes, { 'support metrics check': (r) => r.status === 200 });
    });
    
    // Then they try to reproduce the issue
    group('Issue Reproduction', function() {
      const issueTypes = ['error', 'slow', 'timeout', 'normal'];
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      
      if (issueType === 'error') {
        // Try to reproduce error
        const errorRes = http.get(`${BASE_URL}/nonexistent-endpoint`);
        check(errorRes, { 'error reproduced': (r) => r.status === 404 });
        businessValue.add(-5, { type: 'support_error_reproduction' });
        
      } else {
        // Normal support test
        const supportRes = http.get(`${BASE_URL}/chat?name=support_${ticketId}`);
        check(supportRes, { 'support test works': (r) => r.status === 200 });
        businessValue.add(1, { type: 'support_test' });
      }
    });
  });
}
