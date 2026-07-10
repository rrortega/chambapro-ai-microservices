import { FastifyInstance } from 'fastify';
import { redis } from '../services/redis';
import { AI_CONFIG } from '../config';

export async function cacheRoutes(fastify: FastifyInstance) {
  fastify.delete('/v1/cache/translations', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${AI_CONFIG.internalApiKey}`) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

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
