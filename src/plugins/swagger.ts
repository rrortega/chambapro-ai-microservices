import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export const swaggerPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'ChambaPro AI Inference Gateway',
        description: 'EN: API for local AI inference (Embeddings & Translation) | ES: API para inferencia local de IA.',
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

  const customCss = `
    .swagger-ui .topbar { display: none; }
    body { background-color: #0f172a; color: #f8fafc; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); padding-top: 2rem; }
  `;

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    theme: {
      title: 'API Docs - ChambaPro AI',
      css: [{ filename: 'theme.css', content: customCss }]
    },
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });
});
