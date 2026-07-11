import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import scalarApiReference from '@scalar/fastify-api-reference';

export const swaggerPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'ChambaPro AI Gateway',
        description: '### Bilingual API (EN/ES)\n\nEN: API for local AI inference (Embeddings & Translation) \n\nES: API para inferencia local de IA.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
          },
        },
      },
      security: [{ ApiKeyAuth: [] }],
    }
  });

  await fastify.register(scalarApiReference, {
    routePrefix: '/docs',
    configuration: {
      theme: 'default',
      layout: 'modern',
      spec: {
        content: () => fastify.swagger(),
      },
      metaData: {
        title: 'ChambaPro AI API'
      }
    }
  });
});
