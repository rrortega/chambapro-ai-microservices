import { FastifyInstance } from 'fastify';
import { redis } from '../services/redis';

export async function cacheRoutes(fastify: FastifyInstance) {
  fastify.delete('/v1/cache/translations', {
    schema: {
      tags: ['Cache'],
      summary: 'EN: Clear translations cache | ES: Limpiar caché de traducciones',
      description: 'EN: Clears all translations or a specific one by hash. | ES: Limpia toda la caché o una específica por hash.',
      querystring: {
        type: 'object',
        properties: {
          hash: { type: 'string', description: 'Optional. Specific translation hash to delete.' }
        }
      }
    }
  }, async (request, reply) => {
    // Auth is now handled globally via x-api-key hook
    const query = request.query as any;
    
    try {
      if (query.hash) {
        const keys = await redis.keys(`translation:*:${query.hash}`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        return reply.send({ success: true, deleted: keys.length });
      } else {
        const keys = await redis.keys('translation:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        return reply.send({ success: true, deleted: keys.length });
      }
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}
