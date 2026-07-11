import dotenv from 'dotenv';
dotenv.config();

export const AI_CONFIG = {
  embeddings: {
    provider: process.env.AI_EMBEDDINGS_PROVIDER || 'local', // 'local' | 'external'
    localUrl: process.env.AI_EMBEDDINGS_LOCAL_URL || 'http://localhost:8080/v1/embeddings',
    externalUrl: process.env.AI_EMBEDDINGS_EXTERNAL_URL || 'https://api.openai.com/v1/embeddings',
    externalApiKey: process.env.AI_EMBEDDINGS_EXTERNAL_API_KEY || process.env.OPENAI_API_KEY || '',
    externalModel: process.env.AI_EMBEDDINGS_EXTERNAL_MODEL || 'text-embedding-3-small',
  },
  translation: {
    provider: process.env.AI_TRANSLATION_PROVIDER || 'local', // 'local' | 'external'
    localUrl: process.env.AI_TRANSLATION_LOCAL_URL || 'http://localhost:8090/v1/translations',
    externalUrl: process.env.AI_TRANSLATION_EXTERNAL_URL || 'https://api.openai.com/v1/chat/completions',
    externalApiKey: process.env.AI_TRANSLATION_EXTERNAL_API_KEY || process.env.OPENAI_API_KEY || '',
    externalModel: process.env.AI_TRANSLATION_EXTERNAL_MODEL || 'gpt-4o-mini',
    cacheTtl: parseInt(process.env.AI_TRANSLATION_CACHE_TTL || '86400', 10),
  },
  internalApiKey: process.env.INTERNAL_AI_API_KEY || 'secreto_interno',
  globalApiKey: process.env.GLOBAL_API_KEY || 'chambapro_global_key',
  telemetry: {
    enabled: process.env.ENABLE_TELEMETRY === 'true',
    exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
    serviceName: process.env.OTEL_SERVICE_NAME || 'chambapro-ai-gateway',
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
};
