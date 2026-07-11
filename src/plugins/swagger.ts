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

  // Serve the custom RapiDoc UI
  fastify.get('/docs', async (request, reply) => {
    reply.type('text/html');
    return `<!doctype html>
<html>
<head>
  <title>ChambaPro AI API</title>
  <meta charset="utf-8">
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  </style>
</head>
<body>
  <rapi-doc 
    spec-url="/docs/json"
    theme="dark"
    render-style="read"
    show-header="true"
    allow-try="true"
    allow-authentication="true"
    primary-color="#3b82f6"
    nav-bg-color="#0f172a"
    bg-color="#020617"
    text-color="#f8fafc"
    header-color="#0f172a"
  >
    <div slot="nav-logo" style="display: flex; align-items: center; justify-content: center; padding: 1rem 0;">
      <h2 style="color: #fff; margin: 0;">ChambaPro AI</h2>
    </div>
  </rapi-doc>
</body>
</html>`;
  });
});
