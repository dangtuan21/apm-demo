const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const opentelemetry = require('@opentelemetry/api');

// Configure OTLP exporter for K8s Tempo (internal service)
const otlpExporter = new OTLPTraceExporter({
  url: process.env.OTLP_ENDPOINT || 'http://tempo:4318/v1/traces',
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
