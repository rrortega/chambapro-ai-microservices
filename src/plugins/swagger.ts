import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';

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

  // Expose the raw JSON schema
  fastify.get('/docs/json', async () => {
    return fastify.swagger();
  });

  // Serve Stoplight Elements UI (Modern Stripe style with Try-It out)
  fastify.get('/docs', async (request, reply) => {
    reply.type('text/html');
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>ChambaPro AI API</title>
    <!-- Stoplight Elements -->
    <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
    <style>
      body { margin: 0; padding: 0; height: 100vh; }
    </style>
  </head>
  <body>
    <elements-api
      apiDescriptionUrl="/docs/json"
      router="hash"
      layout="sidebar"
      hideTryIt="false"
      logo="https://chambapro.com/favicon.ico"
    ></elements-api>
  </body>
</html>`;
  });
});
