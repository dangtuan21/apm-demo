const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const opentelemetry = require('@opentelemetry/api');

// Configure OTLP exporter for local Tempo (accessible from K8s via host network)
const otlpExporter = new OTLPTraceExporter({
  url: process.env.OTLP_ENDPOINT || 'http://192.168.1.184:4318/v1/traces',
  headers: {},
});

// Initialize the SDK
const sdk = new NodeSDK({
  traceExporter: otlpExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable some instrumentations if needed
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      // Configure Express instrumentation to capture status codes
      '@opentelemetry/instrumentation-express': {
        enabled: true,
        requestHook: (span, info) => {
          span.setAttributes({
            'http.method': info.request.method,
            'http.url': info.request.url,
            'http.target': info.request.url,
          });
        },
        responseHook: (span, info) => {
          const statusCode = info.response.statusCode;
          span.setAttributes({
            'http.status_code': statusCode,
            'http.response.status_code': statusCode,
          });
          if (statusCode >= 400) {
            span.setStatus({
              code: opentelemetry.SpanStatusCode.ERROR,
              message: `HTTP ${statusCode}`,
            });
          }
        },
      },
    }),
  ],
  serviceName: process.env.SERVICE_NAME || 'apm-backend',
  serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
});

// Start the SDK
sdk.start();

// Get tracer for custom spans
const tracer = opentelemetry.trace.getTracer('apm-backend', '1.0.0');

// Helper function to create custom spans
function createSpan(name, operation) {
  return tracer.startSpan(name, {
    kind: opentelemetry.SpanKind.INTERNAL,
    attributes: {
      'service.name': 'apm-backend',
      'operation.name': operation,
    },
  });
}

// Helper function to add span events
function addSpanEvent(span, name, attributes = {}) {
  span.addEvent(name, {
    timestamp: Date.now(),
    ...attributes,
  });
}

// Helper function to set span attributes
function setSpanAttributes(span, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttributes({ [key]: value });
  });
}

module.exports = {
  tracer,
  createSpan,
  addSpanEvent,
  setSpanAttributes,
  opentelemetry,
};

console.log('🔍 OpenTelemetry tracing initialized');
