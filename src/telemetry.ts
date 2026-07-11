import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { metrics } from '@opentelemetry/api';
import { AI_CONFIG } from './config';

let sdk: NodeSDK | null = null;

export function initTelemetry() {
  if (!AI_CONFIG.telemetry.enabled) {
    console.log('[Telemetry] Disabled via config');
    return;
  }

  sdk = new NodeSDK({
    serviceName: AI_CONFIG.telemetry.serviceName,
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: AI_CONFIG.telemetry.exporterEndpoint,
      }),
      exportIntervalMillis: 10000,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  console.log(`[Telemetry] Started for service: ${AI_CONFIG.telemetry.serviceName}`);

  process.on('SIGTERM', () => {
    sdk?.shutdown().catch((err) => console.error('Error shutting down telemetry', err));
  });
}

const meter = metrics.getMeter(AI_CONFIG.telemetry.serviceName || 'chambapro-ai-gateway');

export const fallbackCounter = meter.createCounter('ai_gateway_fallbacks_total', {
  description: 'Counts the number of times local inference fell back to external provider',
});

export const tokenCounter = meter.createCounter('ai_gateway_tokens_total', {
  description: 'Counts the number of characters/tokens processed',
});
