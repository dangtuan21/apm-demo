// Simple tracing test
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const opentelemetry = require('@opentelemetry/api');

// Configure OTLP exporter for local Tempo
const otlpExporter = new OTLPTraceExporter({
  url: 'http://192.168.1.184:4318/v1/traces',
  headers: {},
});

// Initialize the SDK
const sdk = new NodeSDK({
  traceExporter: otlpExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'test-tracer',
});

// Start tracing
sdk.start();
console.log('🔍 Tracing initialized for test');

// Create a test span
const tracer = opentelemetry.trace.getTracer('test-tracer');

async function generateTestTrace() {
  const span = tracer.startSpan('test-operation');
  
  span.setAttributes({
    'test.name': 'tracing-verification',
    'test.timestamp': Date.now(),
  });
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  span.addEvent('Test trace generated');
  span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
  span.end();
  
  console.log('✅ Test trace generated');
}

// Generate test trace
generateTestTrace().then(() => {
  console.log('🎯 Test trace sent to Tempo');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error generating trace:', err);
  process.exit(1);
});
