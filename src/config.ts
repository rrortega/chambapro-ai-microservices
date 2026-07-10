import dotenv from 'dotenv';
dotenv.config();

export const AI_CONFIG = {
  embeddings: {
    provider: process.env.AI_EMBEDDINGS_PROVIDER || 'local', // 'local' | 'external'
    localUrl: process.env.AI_EMBEDDINGS_LOCAL_URL || 'http://localhost:8080/v1/embeddings',
    externalUrl: process.env.AI_EMBEDDINGS_EXTERNAL_URL || 'https://api.openai.com/v1/embeddings',
  },
  translation: {
    provider: process.env.AI_TRANSLATION_PROVIDER || 'local', // 'local' | 'external'
    localUrl: process.env.AI_TRANSLATION_LOCAL_URL || 'http://localhost:8090/v1/translations',
    externalUrl: process.env.AI_TRANSLATION_EXTERNAL_URL || 'https://api.openai.com/v1/chat/completions',
    cacheTtl: parseInt(process.env.AI_TRANSLATION_CACHE_TTL || '86400', 10),
  },
  internalApiKey: process.env.INTERNAL_AI_API_KEY || 'secreto_interno',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
};
