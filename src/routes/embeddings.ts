import { FastifyInstance } from 'fastify';
import { getEmbeddings } from '../services/embeddings';

export async function embeddingsRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/embeddings', async (request, reply) => {
    const body = request.body as any;
    
    if (!body || !body.input) {
      return reply.code(400).send({ error: 'Missing input field' });
    }

    try {
      const inputs = Array.isArray(body.input) ? body.input : [body.input];
      const data = [];
      
      for (let i = 0; i < inputs.length; i++) {
        const embedding = await getEmbeddings(inputs[i]);
        data.push({
          object: 'embedding',
          embedding,
          index: i,
        });
      }

      return reply.send({
        object: 'list',
        data,
        model: body.model || 'multilingual-e5-small',
        usage: {
          prompt_tokens: 0,
          total_tokens: 0,
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}
