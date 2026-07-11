import { initTelemetry } from './telemetry';
// Inicializar telemetría ANTES de iniciar el resto de la app
initTelemetry();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { embeddingsRoutes } from './routes/embeddings';
import { translationRoutes } from './routes/translations';
import { cacheRoutes } from './routes/cache';
import { authPlugin } from './plugins/auth';
import { swaggerPlugin } from './plugins/swagger';

const fastify = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      strict: false,
      allowUnionTypes: true
    }
  }
});

// Plugins globales
fastify.register(cors, { origin: '*' });
fastify.register(swaggerPlugin);
fastify.register(authPlugin);

// Rutas
fastify.register(embeddingsRoutes);
fastify.register(translationRoutes);
fastify.register(cacheRoutes);

fastify.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
