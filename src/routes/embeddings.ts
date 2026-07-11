import { FastifyInstance } from 'fastify';
import { getEmbeddings } from '../services/embeddings';
import { tokenCounter } from '../telemetry';

export async function embeddingsRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/embeddings', {
    schema: {
      tags: ['Embeddings'],
      summary: 'EN: Generate text embeddings | ES: Generar embeddings de texto',
      description: 'EN: Converts text into a vector space. | ES: Convierte texto en un espacio vectorial.',
      body: {
        type: 'object',
        required: ['input'],
        properties: {
          input: { type: ['string', 'array'], items: { type: 'string' } },
          model: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;
    
    if (!body || !body.input) {
      return reply.code(400).send({ error: 'Missing input field' });
    }

    try {
      const inputs = Array.isArray(body.input) ? body.input : [body.input];
      const data = [];
      let totalChars = 0;
      
      for (let i = 0; i < inputs.length; i++) {
        const text = inputs[i];
        totalChars += text.length;
        const embedding = await getEmbeddings(text);
        data.push({
          object: 'embedding',
          embedding,
          index: i,
        });
      }

      // Add to telemetry
      tokenCounter.add(totalChars);

      return reply.send({
        object: 'list',
        data,
        model: body.model || 'multilingual-e5-small',
        usage: {
          prompt_tokens: totalChars,
          total_tokens: totalChars,
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}
