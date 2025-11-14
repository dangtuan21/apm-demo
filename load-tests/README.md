# K6 Load Testing for APM Backend

This directory contains K6 load testing scripts to test your Node.js backend and generate data for Grafana monitoring.

## 📋 Prerequisites

### Install K6:
```bash
# macOS
brew install k6

# Or download from: https://k6.io/docs/get-started/installation/
```

### Make sure your backend is running:
```bash
cd ../backend
npm run dev
```

## 🚀 Load Test Scripts

### 1. **Basic Load Test** (`basic-load-test.js`)
**Purpose**: Realistic user behavior simulation
- **Duration**: ~4 minutes
- **Users**: 10 → 20 users
- **Scenarios**: Chat (60%), Health (20%), Metrics (10%), Login/Logout (10%)
- **Thresholds**: P95 < 500ms, Error rate < 5%

```bash
k6 run basic-load-test.js
```

### 2. **Stress Test** (`stress-test.js`)
**Purpose**: Find system breaking point
- **Duration**: ~10 minutes
- **Users**: 50 → 100 → 200 → 300 users
- **Focus**: Heavy chat endpoint usage
- **Thresholds**: P95 < 1000ms, Error rate < 10%

```bash
k6 run stress-test.js
```

### 3. **Spike Test** (`spike-test.js`)
**Purpose**: Test sudden traffic spikes
- **Duration**: ~3 minutes
- **Pattern**: Normal → Spike → Normal → Bigger Spike
- **Users**: 10 → 100 → 10 → 200 users
- **Thresholds**: P95 < 2000ms, Error rate < 15%

```bash
k6 run spike-test.js
```

## 📊 What to Watch in Grafana

While running load tests, monitor these panels in your Grafana dashboard:

### 🎯 **Key Metrics to Observe:**

1. **Request Counter Timeline** - See traffic spikes
2. **Error Rate %** - Watch for threshold breaches
3. **Response Time P95** - Latency under load
4. **Memory Usage** - Resource consumption
5. **CPU Usage** - System utilization
6. **Active Users** - Concurrent user simulation
7. **Top Endpoints by Traffic** - Load distribution

### 🚨 **Expected Behaviors:**

**During Basic Load Test:**
- Steady increase in request rate
- Memory usage should be stable
- P95 latency should stay < 500ms
- Error rate should stay < 5%

**During Stress Test:**
- High memory usage
- Increased CPU usage
- P95 latency may spike > 500ms
- Some errors are expected at high load

**During Spike Test:**
- Sudden spikes in all metrics
- Memory may spike then stabilize
- Latency spikes during traffic bursts
- System should recover after spikes

## 🔧 Customization

### Modify Load Patterns:
Edit the `stages` array in each script:
```javascript
stages: [
  { duration: '30s', target: 10 },  // 30 seconds to reach 10 users
  { duration: '1m', target: 20 },   // 1 minute at 20 users
]
```

### Add New Endpoints:
Add to the test functions:
```javascript
function testNewEndpoint() {
  const response = http.get(`${BASE_URL}/new-endpoint`);
  // Add checks...
}
```

### Adjust Thresholds:
```javascript
thresholds: {
  http_req_duration: ['p(95)<200'],  // Stricter: 200ms
  http_req_failed: ['rate<0.01'],    // Stricter: 1% error rate
}
```

## 📈 Results Analysis

After each test, check:

1. **Console Output** - Real-time summary
2. **JSON Results** - Detailed metrics in `*-results.json`
3. **Grafana Dashboard** - Visual timeline of system behavior
4. **Prometheus Queries** - Historical data analysis

## 🎯 Performance Targets

### **Good Performance:**
- P95 latency < 200ms under normal load
- Error rate < 1%
- Memory usage stable
- CPU usage < 70%

### **Acceptable Under Stress:**
- P95 latency < 1000ms
- Error rate < 10%
- System recovers after load reduction

### **Red Flags:**
- P95 latency > 2000ms
- Error rate > 15%
- Memory leaks (constantly growing)
- System doesn't recover

## 🚀 Advanced Usage

### Run with Custom Options:
```bash
# Override VUs and duration
k6 run --vus 50 --duration 2m basic-load-test.js

# Output to InfluxDB (if configured)
k6 run --out influxdb=http://localhost:8086/k6 basic-load-test.js
```

### Continuous Load Testing:
```bash
# Run tests in sequence
k6 run basic-load-test.js && k6 run stress-test.js && k6 run spike-test.js
```

Happy load testing! 🚀📊
