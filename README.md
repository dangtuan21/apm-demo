# 🚀 APM Chat Application with Distributed Tracing

A complete Application Performance Monitoring (APM) stack featuring:
- **Node.js Backend** with OpenTelemetry instrumentation
- **React Frontend** for user interaction  
- **Prometheus** for metrics collection
- **Grafana** for visualization and dashboards
- **Tempo** for distributed tracing
- **Kubernetes** deployment ready

## Project Structure

```
apm/
├── backend/                    # Node.js Express server with OpenTelemetry
│   ├── package.json
│   ├── server.js
│   └── tracing.js             # OpenTelemetry configuration
├── frontend/                   # React application
│   ├── package.json
│   ├── public/
│   └── src/
├── k8s/                       # Kubernetes deployment files
│   ├── backend-deployment.yaml
│   ├── tempo-deployment.yaml
│   └── tempo-config.yaml
├── monitoring/                # Monitoring stack configuration
│   ├── grafana/
│   │   └── provisioning/
│   │       ├── dashboards/    # Pre-built Grafana dashboards
│   │       └── datasources/   # Prometheus & Tempo datasources
│   ├── tempo-docker.yaml      # Tempo configuration for Docker
│   └── tempo.yaml            # Tempo configuration for K8s
├── docker-compose.yml         # Complete monitoring stack
└── README.md
```

## 🎯 Features

### **Application Features**
- **Backend**: REST API with `/chat` endpoint featuring 9 custom instrumented spans
- **Frontend**: React app with input form for user interaction
- **Health Check**: `/health` endpoint for monitoring

### **APM & Observability Features**
- **📊 Metrics Collection**: Prometheus metrics for HTTP requests, response times, and system metrics
- **🔍 Distributed Tracing**: OpenTelemetry traces with detailed span analysis across service boundaries
- **📈 Grafana Dashboards**: Pre-built dashboards for metrics and tracing visualization
- **🚨 Error Tracking**: HTTP status code capture and error trace analysis
- **⚡ Performance Monitoring**: Request latency, throughput, and resource utilization
- **🎯 Custom Spans**: Detailed instrumentation of business logic operations

### **Enterprise & Production Features**
- **⚖️ Load Balancing**: Kubernetes deployment with 2 replicas and service load balancing
- **🛡️ High Availability (HA)**: Multi-replica backend deployment with automatic failover
- **🔄 Fault Tolerance**: Health checks and automatic pod restart on failure
- **📊 Service Discovery**: Kubernetes native service discovery and DNS resolution
- **🎯 Traffic Distribution**: Even request distribution across backend instances
- **🔍 End-to-End Tracing**: Complete request flow visibility across load-balanced instances
- **📈 Scalability**: Horizontal pod autoscaling ready with resource-based scaling
- **🚨 Monitoring & Alerting**: Real-time health monitoring with Grafana dashboards and alert notifications
- **🧪 Load Testing**: K6 performance testing suite with load, stress, spike, and endurance tests

## 🚀 Quick Start

### **Option 1: Complete APM Stack (Recommended)**

1. **Start the monitoring stack**:
```bash
docker-compose up -d
```

2. **Start the backend with tracing**:
```bash
cd backend
npm install
PORT=8051 OTLP_ENDPOINT=http://localhost:4318/v1/traces npm start
```

3. **Start the frontend**:
```bash
cd frontend
npm install
npm start
```

### **Option 2: Simple Development**

1. **Backend only**:
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:8050
```

2. **Frontend**:
```bash
cd frontend
npm install
npm start    # Runs on http://localhost:3050
```

## 📡 API Endpoints

### GET /chat
- **Parameter**: `name` (query parameter)
- **Response**: `{ "message": "Hi <name>! Welcome to our resource-intensive chat!" }`
- **Example**: `GET /chat?name=John` → `{ "message": "Hi John! Welcome to our resource-intensive chat!" }`
- **Tracing**: Generates 9 custom spans for detailed performance analysis

### GET /health
- **Response**: `{ "status": "OK", "timestamp": "..." }`
- **Purpose**: Health check endpoint for monitoring

### GET /metrics
- **Response**: Prometheus metrics in text format
- **Purpose**: Metrics scraping endpoint for Prometheus

## 📊 Monitoring & Observability

### **Access Points**
- **🎨 Grafana**: http://localhost:3000 (admin/admin123)
- **📈 Prometheus**: http://localhost:9090
- **🔍 Tempo**: http://localhost:3200

### **Pre-built Grafana Dashboards**
1. **🔥 Popular Tracing Dashboard** - Comprehensive tracing analysis
2. **🔍 Distributed Tracing Dashboard** - Service maps and trace details  
3. **✅ Simple Tracing Dashboard** - Basic trace visualization
4. **📊 APM Backend Monitoring** - Metrics and performance monitoring

### **Available Metrics**
- **HTTP Requests**: `http_requests_total`, `http_request_duration_seconds`
- **System Metrics**: Memory usage, CPU utilization, event loop lag
- **Custom Metrics**: Business logic performance indicators

### **Distributed Tracing Features**
- **🎯 9 Custom Spans per /chat request**:
  - `chat_request` - Main request span
  - `calculate_primes` - CPU intensive operation
  - `string_manipulation` - String processing
  - `json_operations` - JSON serialization
  - `array_operations` - Array processing
  - `memory_operations` - Memory allocation
  - `database_operations` - Simulated DB calls
  - `io_simulation` - I/O operations
  - `response_generation` - Response formatting

### **TraceQL Queries**
```sql
-- All backend traces
{ .service.name = "apm-backend" }

-- Chat endpoint only
{ .service.name = "apm-backend" && .http.route = "/chat" }

-- Error traces (4xx/5xx)
{ .service.name = "apm-backend" && .http.status_code >= 400 }

-- Slow traces (>20ms)
{ .service.name = "apm-backend" && duration > 20ms }
```

## 🐳 Kubernetes Deployment

### **Deploy to Minikube**

1. **Start minikube**:
```bash
minikube start
```

2. **Build and load backend image**:
```bash
docker build -t apm-backend-tracing:latest -f k8s/Dockerfile backend/
minikube image load apm-backend-tracing:latest
```

3. **Deploy the application**:
```bash
kubectl apply -f k8s/
```

4. **Access the application**:
```bash
kubectl port-forward service/apm-backend 8050:8050
```

### **Kubernetes Components**
- **Backend Deployment**: 2 replicas with OpenTelemetry tracing and load balancing
- **Load Balancer Service**: Automatic traffic distribution across healthy pods
- **Health Checks**: Liveness and readiness probes for automatic failover
- **Tempo Deployment**: Distributed tracing backend for cross-service visibility
- **Service Discovery**: DNS-based service resolution and communication
- **High Availability**: Multi-AZ deployment ready with pod anti-affinity rules

## 🧪 Testing & Usage

### **Generate Test Traffic**
```bash
# Generate chat requests
for i in {1..10}; do 
  curl "http://localhost:8051/chat?name=User$i"
  sleep 1
done

# Generate 404 errors for error tracing
curl "http://localhost:8051/nonexistent-endpoint"

# Test load balancing (K8s deployment)
for i in {1..20}; do 
  curl "http://localhost:8050/chat?name=LoadTest$i" & 
done
wait

# Test failover by killing a pod
kubectl delete pod -l app=apm-backend --force --grace-period=0
```

### **View Traces**
1. Go to Grafana Explore: http://localhost:3000/explore
2. Select **Tempo** datasource
3. Use TraceQL queries to find specific traces
4. Click on traces to see detailed span waterfall

### **Monitor Metrics**
1. Open Grafana dashboards: http://localhost:3000
2. View real-time metrics and performance data
3. Analyze request patterns and system health

## 🔧 Configuration

### **Environment Variables**
- `PORT`: Backend server port (default: 8050)
- `OTLP_ENDPOINT`: OpenTelemetry collector endpoint
- `SERVICE_NAME`: Service name for tracing (default: apm-backend)
- `SERVICE_VERSION`: Service version (default: 1.0.0)

### **Docker Compose Services**
- **Grafana**: Visualization and dashboards
- **Prometheus**: Metrics collection and storage
- **Tempo**: Distributed tracing backend

## 🚨 Alerting & Notifications

### **Pre-configured Alert Rules**
- **High Error Rate**: >5% error rate for 2 minutes
- **Critical Error Rate**: >15% error rate for 1 minute  
- **High Response Time**: 95th percentile >500ms for 3 minutes
- **Service Down**: Backend unavailable for 1 minute
- **Memory Usage High**: >80% heap usage for 5 minutes

### **Notification Channels**
- **📧 Email**: SMTP notifications to administrators
- **💬 Slack**: Real-time alerts to team channels
- **📞 Webhook**: Custom HTTP endpoints for integrations
- **📱 PagerDuty**: Incident management and escalation

### **Testing Alerts**

1. **Start the alert webhook server**:
```bash
node alert-webhook-server.js
```

2. **Generate errors to trigger alerts**:
```bash
# Generate high error rate
for i in {1..50}; do 
  curl "http://localhost:8051/nonexistent-endpoint" &
done
```

3. **Monitor alerts in Grafana**:
   - Go to **Alerting** → **Alert Rules**
   - View **Firing** alerts in real-time
   - Check webhook server console for notifications

### **Alert Configuration Files**
- `monitoring/grafana/provisioning/alerting/alert-rules.yml` - Alert definitions
- `monitoring/grafana/provisioning/alerting/notification-policies.yml` - Routing rules
- `monitoring/grafana/provisioning/alerting/alerting.yml` - Channel configurations

## 🧪 Load Testing & Performance Testing with K6

### **K6 Test Suite Overview**
- **🔄 Load Test**: Gradual ramp-up to test normal capacity (16 minutes)
- **💥 Stress Test**: High load to find breaking point (9 minutes)  
- **⚡ Spike Test**: Sudden traffic spikes to test elasticity (2 minutes)
- **⏳ Endurance Test**: Long-duration test for memory leaks (34 minutes)

### **Installation & Setup**

1. **Install K6**:
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Windows
choco install k6
```

2. **Run Load Tests**:
```bash
# Interactive test runner
./k6-tests/run-tests.sh

# Or run individual tests
k6 run k6-tests/load-test.js
k6 run k6-tests/stress-test.js
k6 run k6-tests/spike-test.js
k6 run k6-tests/endurance-test.js
```

### **Test Scenarios**

#### **🔄 Load Test**
- **Purpose**: Test normal operating capacity
- **Pattern**: Gradual ramp-up from 0 → 10 → 20 users
- **Duration**: 16 minutes
- **Thresholds**: 95% requests < 500ms, error rate < 5%

#### **💥 Stress Test**  
- **Purpose**: Find system breaking point
- **Pattern**: Aggressive ramp-up to 300 users
- **Duration**: 9 minutes
- **Thresholds**: 95% requests < 1s, error rate < 10%

#### **⚡ Spike Test**
- **Purpose**: Test sudden traffic spikes
- **Pattern**: Instant jumps from 10 → 200 → 500 users
- **Duration**: 2 minutes
- **Thresholds**: 95% requests < 2s, error rate < 15%

#### **⏳ Endurance Test**
- **Purpose**: Detect memory leaks and degradation
- **Pattern**: Steady 20 users for 30 minutes
- **Duration**: 34 minutes
- **Thresholds**: No performance degradation over time

### **Monitoring During Load Tests**

1. **Real-time Metrics**: Watch Grafana dashboards during tests
2. **Distributed Tracing**: Analyze trace patterns under load
3. **Alert Notifications**: Monitor alert firing during stress
4. **Resource Usage**: Track CPU, memory, and network utilization

### **K6 Test Results Integration**

- **Custom Metrics**: K6 exports metrics to Prometheus
- **Grafana Visualization**: Load test results in dashboards  
- **Alert Triggering**: Tests designed to trigger alerts at thresholds
- **Trace Analysis**: Each request generates distributed traces

## 🚀 Next Steps

- **📝 Logging**: Add structured logging with correlation IDs
- **🔐 Security**: Implement authentication and authorization
- **📊 Custom Metrics**: Add business-specific metrics and KPIs
- **� Advanced K6 Testing**: Custom scenarios, CI/CD integration, and performance regression testing
- **☁️ Cloud Deployment**: Deploy to AWS/GCP/Azure with managed services
- **🔔 Advanced Alerting**: Integrate with PagerDuty, OpsGenie, or ServiceNow
