# APM Chat Application

A simple React frontend + Node.js backend application with a chat endpoint.

## Project Structure

```
apm/
├── backend/          # Node.js Express server
│   ├── package.json
│   └── server.js
├── frontend/         # React application
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── index.js
│       └── index.css
└── README.md
```

## Features

- **Backend**: REST API with `/chat` endpoint that accepts a `name` parameter and returns `Hi <name>`
- **Frontend**: React app with input form that calls the backend and displays the response

## Setup & Running

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend will run on http://localhost:8050

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend will run on http://localhost:3050

## API Endpoints

### GET /chat
- **Parameter**: `name` (query parameter)
- **Response**: `{ "message": "Hi <name>" }`
- **Example**: `GET /chat?name=John` → `{ "message": "Hi John" }`

### GET /health
- **Response**: `{ "status": "OK", "timestamp": "..." }`

## Usage

1. Start both backend and frontend servers
2. Open http://localhost:3050 in your browser
3. Enter a name in the input field
4. Click "Submit" to see the greeting response

## Monitoring with Grafana + Prometheus

### Setup Monitoring Stack

1. **Install backend dependencies**:
```bash
cd backend
npm install
```

2. **Start the monitoring stack**:
```bash
# From the root directory
docker-compose up -d
```

3. **Start your application**:
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2) 
cd frontend
npm start
```

### Access Monitoring

- **Grafana**: http://localhost:3000
  - Username: `admin`
  - Password: `admin123`
  - Pre-configured dashboard: "APM Backend Monitoring"

- **Prometheus**: http://localhost:9090
  - Metrics endpoint: http://localhost:8050/metrics

### Available Metrics

The backend now exposes these metrics:
- **HTTP request count**: `http_requests_total`
- **HTTP request duration**: `http_request_duration_seconds`
- **Node.js default metrics**: memory, CPU, event loop, etc.

### Grafana Dashboard Features

- **Request Rate**: HTTP requests per second
- **Response Time**: 95th and 50th percentile latencies  
- **Status Codes**: Breakdown by HTTP status codes
- **Memory Usage**: Node.js heap usage
- **CPU Usage**: Process CPU utilization

### Testing the Setup

1. Make some requests to your app at http://localhost:3050
2. Check metrics at http://localhost:8050/metrics
3. View dashboards in Grafana at http://localhost:3000

## Next Steps

- Add custom business metrics
- Set up alerting rules
- Create additional dashboards
- Configure log aggregation
