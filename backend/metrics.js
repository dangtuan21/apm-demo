const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'apm-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// =============================================================================
// RED METHOD METRICS (Rate, Errors, Duration)
// =============================================================================

// Rate - Total HTTP requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Errors - HTTP errors
const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
  registers: [register]
});

// Duration - HTTP request duration
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// =============================================================================
// USE METHOD METRICS (Utilization, Saturation, Errors)
// =============================================================================

// Utilization - CPU usage percentage
const cpuUsagePercent = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'Current CPU usage percentage',
  registers: [register]
});

// Utilization - Memory usage
const memoryUsageBytes = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Current memory usage in bytes',
  labelNames: ['type'], // heap_used, heap_total, rss, external
  registers: [register]
});

// Saturation - Custom queue length (example)
const queueLength = new client.Gauge({
  name: 'app_queue_length_current',
  help: 'Current application queue length',
  registers: [register]
});

// Saturation - Connection pool size
const connectionPoolSize = new client.Gauge({
  name: 'app_connection_pool_active',
  help: 'Active connections in pool',
  registers: [register]
});

// Errors - System errors
const systemErrorsTotal = new client.Counter({
  name: 'system_errors_total',
  help: 'Total number of system errors',
  labelNames: ['type', 'code'],
  registers: [register]
});

// =============================================================================
// BUSINESS METRICS
// =============================================================================

// User activity
const userLogins = new client.Counter({
  name: 'user_logins_total',
  help: 'Total user logins',
  labelNames: ['success'],
  registers: [register]
});

const activeUsers = new client.Gauge({
  name: 'active_users_current',
  help: 'Currently active users',
  registers: [register]
});

// Database metrics
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const dbConnectionsActive = new client.Gauge({
  name: 'db_connections_active',
  help: 'Active database connections',
  registers: [register]
});

// =============================================================================
// ENHANCED RESTART TRACKING METRICS
// =============================================================================

// Application start time
const appStartTime = new client.Gauge({
  name: 'app_start_time_seconds',
  help: 'Time when application started (Unix timestamp)',
  registers: [register]
});

// Application restarts counter
const appRestartsTotal = new client.Counter({
  name: 'app_restarts_total',
  help: 'Total number of application restarts',
  registers: [register]
});

// Application uptime
const appUptimeSeconds = new client.Gauge({
  name: 'app_uptime_seconds',
  help: 'Application uptime in seconds',
  registers: [register]
});

// Request rate (calculated metric)
const requestRatePerSecond = new client.Gauge({
  name: 'app_request_rate_current',
  help: 'Current request rate per second',
  registers: [register]
});

// Initialize restart tracking
const initializeRestartTracking = () => {
  const startTime = Date.now() / 1000;
  appStartTime.set(startTime);
  appRestartsTotal.inc(); // Increment on each startup
  
  console.log(`📊 Application started at: ${new Date(startTime * 1000).toISOString()}`);
  console.log(`🔄 Total restarts: ${appRestartsTotal._getValue ? appRestartsTotal._getValue() : 1}`);
};

// =============================================================================
// SYSTEM MONITORING FUNCTIONS
// =============================================================================

// Update system metrics periodically
const updateSystemMetrics = () => {
  // Memory metrics
  const memUsage = process.memoryUsage();
  memoryUsageBytes.set({ type: 'heap_used' }, memUsage.heapUsed);
  memoryUsageBytes.set({ type: 'heap_total' }, memUsage.heapTotal);
  memoryUsageBytes.set({ type: 'rss' }, memUsage.rss);
  memoryUsageBytes.set({ type: 'external' }, memUsage.external);

  // CPU usage (simplified - you might want to use a proper CPU monitoring library)
  const cpuUsage = process.cpuUsage();
  const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  cpuUsagePercent.set(totalUsage);

  // Update uptime
  const currentUptime = process.uptime();
  appUptimeSeconds.set(currentUptime);

  // Calculate current request rate (requests per second since start)
  const totalRequests = httpRequestsTotal._getValue ? httpRequestsTotal._getValue() : 0;
  const requestRate = currentUptime > 0 ? totalRequests / currentUptime : 0;
  requestRatePerSecond.set(requestRate);

  // Custom application metrics (examples)
  // You can add your own saturation metrics here
  queueLength.set(Math.floor(Math.random() * 10)); // Example: random queue length
  connectionPoolSize.set(5); // Example: fixed connection pool size
};

// Start system metrics collection
const startSystemMetricsCollection = () => {
  // Update every 5 seconds
  setInterval(updateSystemMetrics, 5000);
  
  // Initial update
  updateSystemMetrics();
};

// =============================================================================
// MIDDLEWARE FUNCTIONS
// =============================================================================

// Enhanced metrics middleware with error tracking
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode;
    
    const labels = {
      method: req.method,
      route: route,
      status_code: statusCode
    };
    
    // Record all requests
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
    
    // Record errors (4xx and 5xx)
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      httpErrorsTotal.inc({
        ...labels,
        error_type: errorType
      });
    }
  });
  
  next();
};

// Error handling middleware
const errorMetricsMiddleware = (err, req, res, next) => {
  // Record system errors
  systemErrorsTotal.inc({
    type: 'application_error',
    code: err.code || 'unknown'
  });
  
  next(err);
};

module.exports = {
  // Core
  register,
  startSystemMetricsCollection,
  initializeRestartTracking,
  
  // Middleware
  metricsMiddleware,
  errorMetricsMiddleware,
  
  // RED Method Metrics
  httpRequestsTotal,
  httpErrorsTotal,
  httpRequestDuration,
  
  // USE Method Metrics
  cpuUsagePercent,
  memoryUsageBytes,
  queueLength,
  connectionPoolSize,
  systemErrorsTotal,
  
  // Business Metrics
  userLogins,
  activeUsers,
  dbQueryDuration,
  dbConnectionsActive,
  
  // Enhanced Restart Tracking
  appStartTime,
  appRestartsTotal,
  appUptimeSeconds,
  requestRatePerSecond
};
