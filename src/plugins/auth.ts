import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AI_CONFIG } from '../config';

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const url = request.raw.url;
    // Permitir acceso público a documentación y health check
    if (url === '/' || url?.startsWith('/health') || url?.startsWith('/docs')) {
      return;
    }

    const apiKey = request.headers['x-api-key'];
    if (apiKey !== AI_CONFIG.globalApiKey) {
      return reply.code(401).send({ error: 'Unauthorized: Invalid x-api-key header' });
    }
  });
});
