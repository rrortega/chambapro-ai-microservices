import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fs from 'node:fs';
import path from 'node:path';

export const swaggerPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'ChambaPro AI Gateway',
        description: 'API for local AI inference (Embeddings & Translation).',
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

  // Expose the raw JSON schema
  fastify.get('/docs/json', async () => {
    return fastify.swagger();
  });

  // Serve the custom UI on the root endpoint
  fastify.get('/', async (request, reply) => {
    reply.type('text/html');
    const htmlPath = path.join(__dirname, 'docs.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    return htmlContent;
  });

  // Redirect legacy /docs route to root
  fastify.get('/docs', async (request, reply) => {
    return reply.redirect('/');
  });
});
