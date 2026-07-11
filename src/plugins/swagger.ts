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

  // Serve the custom Redoc UI (Stripe style)
  fastify.get('/docs', async (request, reply) => {
    reply.type('text/html');
    return `<!DOCTYPE html>
<html>
  <head>
    <title>ChambaPro AI API</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <redoc spec-url='/docs/json' theme='{ "colors": { "primary": { "main": "#3b82f6" } } }'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>`;
  });
});
