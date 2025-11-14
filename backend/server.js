const express = require('express');
const cors = require('cors');
const { 
  register, 
  metricsMiddleware, 
  errorMetricsMiddleware,
  startSystemMetricsCollection,
  initializeRestartTracking,
  userLogins,
  activeUsers,
  appRestartsTotal,
  appUptimeSeconds
} = require('./metrics');

const app = express();
const PORT = process.env.PORT || 8050;

// Initialize restart tracking (must be first)
initializeRestartTracking();

// Start system metrics collection
startSystemMetricsCollection();

// Middleware
app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware);

// Chat endpoint with business metrics - RESOURCE INTENSIVE VERSION
app.get('/chat', (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }
  
  // 🔥 CPU INTENSIVE OPERATIONS
  
  // 1. Heavy computation - Calculate prime numbers
  const primeCount = calculatePrimes(1000 + Math.floor(Math.random() * 2000)); // 1000-3000 range
  
  // 2. String manipulation - Create large strings and process them
  let largeString = '';
  for (let i = 0; i < 1000; i++) {
    largeString += `Hello ${name} - iteration ${i} - ${Math.random().toString(36)} `;
  }
  
  // 3. JSON serialization/parsing (CPU intensive)
  const complexObject = generateComplexObject(name, 500); // 500 nested properties
  const serialized = JSON.stringify(complexObject);
  const parsed = JSON.parse(serialized);
  
  // 4. Array operations - Sort large arrays
  const largeArray = Array.from({length: 5000}, () => Math.random());
  const sortedArray = largeArray.sort((a, b) => b - a); // Reverse sort
  
  // 🧠 MEMORY INTENSIVE OPERATIONS
  
  // 5. Create temporary large objects (memory pressure)
  const memoryHogs = [];
  for (let i = 0; i < 100; i++) {
    memoryHogs.push({
      id: i,
      data: new Array(1000).fill(`${name}-data-${i}`),
      timestamp: Date.now(),
      randomData: Math.random().toString(36).repeat(100)
    });
  }
  
  // 6. Simulate database-like operations (more CPU)
  const userProfile = simulateUserProfileLookup(name);
  const recommendations = generateRecommendations(userProfile, 50);
  
  // 7. Artificial delay to simulate I/O (but keep CPU busy)
  const startTime = Date.now();
  while (Date.now() - startTime < 10 + Math.random() * 20) {
    // Busy wait with some computation
    Math.sqrt(Math.random() * 1000000);
  }
  
  // Simulate user interaction - increment active users
  activeUsers.inc();
  
  // Simulate login success
  userLogins.inc({ success: 'true' });
  
  // Return enriched response with computed data
  res.json({ 
    message: `Hi ${name}! Welcome to our resource-intensive chat!`,
    stats: {
      primesCalculated: primeCount,
      stringLength: largeString.length,
      objectProperties: Object.keys(parsed).length,
      sortedArrayLength: sortedArray.length,
      memoryObjectsCreated: memoryHogs.length,
      recommendations: recommendations.length,
      processingTimeMs: Date.now() - startTime + 10
    },
    userProfile: userProfile,
    topRecommendations: recommendations.slice(0, 5)
  });
});

// 🔥 HELPER FUNCTIONS FOR RESOURCE CONSUMPTION

function calculatePrimes(limit) {
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }
  return primes.length;
}

function generateComplexObject(name, depth) {
  const obj = {
    user: name,
    timestamp: Date.now(),
    id: Math.random().toString(36),
  };
  
  for (let i = 0; i < depth; i++) {
    obj[`property_${i}`] = {
      value: Math.random(),
      text: `Generated text for ${name} - ${i}`,
      nested: {
        level1: { level2: { level3: `Deep value ${i}` } },
        array: new Array(10).fill(0).map((_, idx) => `item_${idx}_${i}`)
      }
    };
  }
  
  return obj;
}

function simulateUserProfileLookup(name) {
  // Simulate expensive user profile computation
  const profile = {
    username: name,
    preferences: {},
    history: [],
    analytics: {}
  };
  
  // Generate fake preferences (CPU intensive)
  for (let i = 0; i < 100; i++) {
    profile.preferences[`pref_${i}`] = Math.random() > 0.5;
  }
  
  // Generate fake history (memory intensive)
  for (let i = 0; i < 200; i++) {
    profile.history.push({
      action: `action_${i}`,
      timestamp: Date.now() - Math.random() * 1000000,
      data: new Array(50).fill(`history_data_${i}`)
    });
  }
  
  // Generate analytics (CPU intensive calculations)
  profile.analytics = {
    totalActions: profile.history.length,
    averageSessionTime: profile.history.reduce((sum, h) => sum + Math.random() * 1000, 0) / profile.history.length,
    topCategories: generateTopCategories(50),
    engagementScore: calculateEngagementScore(profile.history)
  };
  
  return profile;
}

function generateRecommendations(userProfile, count) {
  const recommendations = [];
  
  for (let i = 0; i < count; i++) {
    // CPU intensive recommendation algorithm simulation
    const score = calculateRecommendationScore(userProfile, i);
    
    recommendations.push({
      id: `rec_${i}`,
      title: `Recommendation ${i} for ${userProfile.username}`,
      score: score,
      reasons: generateReasons(userProfile, 5),
      metadata: {
        category: `category_${i % 10}`,
        tags: new Array(10).fill(0).map((_, idx) => `tag_${idx}_${i}`),
        computedAt: Date.now()
      }
    });
  }
  
  // Sort by score (more CPU work)
  return recommendations.sort((a, b) => b.score - a.score);
}

function generateTopCategories(count) {
  const categories = [];
  for (let i = 0; i < count; i++) {
    categories.push({
      name: `category_${i}`,
      score: Math.random() * 100,
      subCategories: new Array(20).fill(0).map((_, idx) => `sub_${idx}`)
    });
  }
  return categories.sort((a, b) => b.score - a.score);
}

function calculateEngagementScore(history) {
  // Expensive calculation simulation
  let score = 0;
  for (const item of history) {
    score += Math.sqrt(item.data.length) * Math.random();
    // More computation
    for (let i = 0; i < 100; i++) {
      score += Math.sin(i) * Math.cos(score);
    }
  }
  return Math.round(score % 1000);
}

function calculateRecommendationScore(userProfile, itemId) {
  let score = 0;
  
  // Complex scoring algorithm (CPU intensive)
  for (const [key, value] of Object.entries(userProfile.preferences)) {
    score += value ? Math.random() * 10 : Math.random() * 5;
  }
  
  // Factor in history
  for (const historyItem of userProfile.history) {
    score += historyItem.data.length * 0.1;
  }
  
  // Add some randomness with expensive operations
  for (let i = 0; i < 1000; i++) {
    score += Math.sqrt(Math.random() * itemId) * 0.001;
  }
  
  return Math.round(score * 100) / 100;
}

function generateReasons(userProfile, count) {
  const reasons = [];
  for (let i = 0; i < count; i++) {
    reasons.push(`Because you ${Object.keys(userProfile.preferences)[i % 10]} and have ${userProfile.history.length} interactions`);
  }
  return reasons;
}

// Simulate logout endpoint
app.post('/logout', (req, res) => {
  activeUsers.dec(); // Decrement active users
  res.json({ success: true });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const totalRequests = require('./metrics').httpRequestsTotal._getValue ? 
    require('./metrics').httpRequestsTotal._getValue() : 0;
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime_seconds: uptime,
    uptime_human: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: process.memoryUsage(),
    requests_since_start: totalRequests,
    request_rate_per_second: uptime > 0 ? (totalRequests / uptime).toFixed(2) : 0,
    total_restarts: appRestartsTotal._getValue ? appRestartsTotal._getValue() : 1
  });
});

// Error handling middleware (should be last)
app.use(errorMetricsMiddleware);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});
