import { FastifyInstance } from 'fastify';
import { translateText } from '../services/translation';

export async function translationRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/translations', async (request, reply) => {
    const body = request.body as any;
    
    if (!body || !body.input || !body.source_language || !body.target_language) {
      return reply.code(400).send({ error: 'Missing required fields (input, source_language, target_language)' });
    }

    try {
      const inputs = Array.isArray(body.input) ? body.input : [body.input];
      const data = [];
      
      for (let i = 0; i < inputs.length; i++) {
        const text = await translateText(inputs[i], body.source_language, body.target_language);
        data.push({
          text,
          index: i,
        });
      }

      return reply.send({
        data,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}
