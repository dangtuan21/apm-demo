import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Business metrics that matter to your company
const conversionRate = new Rate('conversion_rate');           // How many visitors become customers
const customerSatisfaction = new Rate('customer_satisfaction'); // Did they have a good experience
const revenueGenerated = new Counter('revenue_generated');     // Business value created
const supportTickets = new Counter('support_tickets');        // Problems that need fixing
const featureAdoption = new Rate('feature_adoption');         // Which features are used
const timeToValue = new Trend('time_to_value');              // How quickly customers get value

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8051';

export const options = {
  scenarios: {
    new_customer_journey: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 }, // 10 new customers trying your service
        { duration: '5m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      exec: 'newCustomerJourney',
    },
  },
  thresholds: {
    // Business success criteria (not just technical metrics)
    conversion_rate: ['rate>0.20'],           // 20% of visitors should convert
    customer_satisfaction: ['rate>0.85'],     // 85% should have good experience
    time_to_value: ['p(90)<120000'],         // 90% get value within 2 minutes
    feature_adoption: ['rate>0.60'],         // 60% should use key features
  },
};

// This simulates a REAL customer journey, not just API calls
export function newCustomerJourney() {
  const customer = {
    id: `customer_${randomString(8)}`,
    type: Math.random() < 0.3 ? 'enterprise' : 'individual', // 30% enterprise customers
    budget: Math.random() < 0.5 ? 'high' : 'low',
    urgency: Math.random() < 0.4 ? 'urgent' : 'casual',
  };
  
  let journeyStartTime = Date.now();
  let customerSatisfied = true;
  let converted = false;
  let valueReceived = false;
  let supportNeeded = false;

  console.log(`🚀 Starting journey for ${customer.type} customer: ${customer.id}`);

  group('🏠 Landing Page Experience', function() {
    // Real customers first check if your service is working
    const healthCheck = http.get(`${BASE_URL}/health`);
    
    if (!check(healthCheck, { 'site loads quickly': (r) => r.timings.duration < 2000 })) {
      console.log(`❌ ${customer.id}: Site too slow, likely to bounce`);
      customerSatisfied = false;
      return; // 80% of users leave if site is slow
    }
    
    // Customers read/evaluate for different amounts of time
    const readingTime = customer.urgency === 'urgent' ? 
      randomIntBetween(5, 15) :   // Urgent customers decide quickly
      randomIntBetween(30, 90);   // Casual customers take their time
    
    sleep(readingTime / 10); // Simulate reading time (scaled down for testing)
    console.log(`📖 ${customer.id}: Spent ${readingTime}s evaluating the service`);
  });

  if (!customerSatisfied) return;

  group('🧪 Trial Experience', function() {
    console.log(`🧪 ${customer.id}: Starting trial experience`);
    
    // First interaction - this is critical for conversion
    const trialStart = Date.now();
    const firstTrial = http.get(`${BASE_URL}/chat?name=${customer.id}_trial`);
    
    const trialSuccess = check(firstTrial, {
      'trial works immediately': (r) => r.status === 200,
      'trial response is fast': (r) => r.timings.duration < 1000,
      'trial gives useful response': (r) => r.body.includes('Welcome'),
    });

    if (!trialSuccess) {
      console.log(`❌ ${customer.id}: Trial failed - very likely to abandon`);
      customerSatisfied = false;
      supportNeeded = true;
      supportTickets.add(1, { reason: 'trial_failure', customer_type: customer.type });
      return;
    }

    // If trial works, customer gets immediate value
    valueReceived = true;
    const timeToFirstValue = Date.now() - trialStart;
    timeToValue.add(timeToFirstValue);
    
    console.log(`✅ ${customer.id}: Got value in ${timeToFirstValue}ms`);
    
    // Different customer types explore differently
    if (customer.type === 'enterprise') {
      // Enterprise customers test thoroughly before buying
      group('Enterprise Evaluation', function() {
        const testScenarios = ['load_test', 'security_test', 'integration_test'];
        
        for (let scenario of testScenarios) {
          const testResult = http.get(`${BASE_URL}/chat?name=${customer.id}_${scenario}`);
          
          if (!check(testResult, { [`${scenario} passes`]: (r) => r.status === 200 })) {
            console.log(`⚠️ ${customer.id}: Enterprise test ${scenario} failed`);
            customerSatisfied = false;
          }
          
          sleep(randomIntBetween(2, 5)); // Enterprise customers are thorough
        }
      });
    } else {
      // Individual customers try a few quick things
      const quickTests = randomIntBetween(2, 4);
      for (let i = 0; i < quickTests; i++) {
        http.get(`${BASE_URL}/chat?name=${customer.id}_test${i}`);
        sleep(randomIntBetween(1, 3));
      }
    }
    
    featureAdoption.add(1); // They used the main feature
  });

  if (!customerSatisfied) return;

  group('💰 Purchase Decision', function() {
    console.log(`💰 ${customer.id}: Making purchase decision`);
    
    // Conversion probability based on customer experience and type
    let conversionProbability = 0.15; // Base 15% conversion rate
    
    if (customer.type === 'enterprise') conversionProbability += 0.10; // Enterprise more likely
    if (customer.budget === 'high') conversionProbability += 0.15;     // High budget more likely
    if (customer.urgency === 'urgent') conversionProbability += 0.20;  // Urgent need more likely
    if (valueReceived) conversionProbability += 0.25;                  // Got value = much more likely
    
    if (Math.random() < conversionProbability) {
      converted = true;
      
      // Different customer types generate different revenue
      const revenue = customer.type === 'enterprise' ? 
        (customer.budget === 'high' ? 5000 : 2000) :  // Enterprise: $2k-5k
        (customer.budget === 'high' ? 500 : 100);     // Individual: $100-500
      
      revenueGenerated.add(revenue, { 
        customer_type: customer.type, 
        budget: customer.budget 
      });
      
      console.log(`🎉 ${customer.id}: CONVERTED! Revenue: $${revenue}`);
      
      // Converted customers do a post-purchase test
      const postPurchase = http.get(`${BASE_URL}/chat?name=${customer.id}_customer`);
      check(postPurchase, { 'post-purchase experience good': (r) => r.status === 200 });
      
    } else {
      console.log(`😞 ${customer.id}: Did not convert (${Math.round(conversionProbability*100)}% chance)`);
    }
  });

  // Final metrics recording
  const totalJourneyTime = Date.now() - journeyStartTime;
  console.log(`📊 ${customer.id}: Journey completed in ${totalJourneyTime}ms`);
  
  conversionRate.add(converted);
  customerSatisfaction.add(customerSatisfied);
  
  if (supportNeeded) {
    console.log(`🎧 ${customer.id}: Will need customer support`);
  }
}

// This is what makes it "Business Process Focused":
// 1. Tests real customer behavior patterns
// 2. Measures business outcomes (conversion, revenue, satisfaction)
// 3. Simulates different customer types and scenarios
// 4. Tracks the entire customer journey, not just API performance
// 5. Provides actionable business insights, not just technical metrics
