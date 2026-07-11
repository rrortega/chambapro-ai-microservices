import { FastifyInstance } from 'fastify';
import { translateText } from '../services/translation';
import { tokenCounter } from '../telemetry';

export async function translationRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/translations', {
    schema: {
      tags: ['Translations'],
      summary: 'EN: Translate text | ES: Traducir texto',
      description: 'EN: Translates text from source to target language. | ES: Traduce texto desde idioma origen al destino.',
      body: {
        type: 'object',
        required: ['input', 'source_language', 'target_language'],
        properties: {
          input: { type: ['string', 'array'], items: { type: 'string' } },
          text: { type: 'string' },
          source_language: { type: 'string', example: 'en' },
          target_language: { type: 'string', example: 'es' },
          target: { type: 'string', example: 'es' },
          ignore_cache: { type: 'boolean', default: false, description: 'Skip cache' },
          beam_size: { type: 'number', default: 1, description: 'Beam size for generation' },
          max_batch_size: { type: 'number', default: 1024, description: 'Max batch size' },
          num_hypotheses: { type: 'number', default: 1, description: 'Number of hypotheses' },
          repetition_penalty: { type: 'number', default: 1.0, description: 'Repetition penalty' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;
    
    const input = body.input || body.text;
    const targetLanguage = body.target_language || body.target;
    const sourceLanguage = body.source_language || 'auto';

    if (!input || !targetLanguage) {
      return reply.code(400).send({ error: 'Missing required fields (input/text, target_language/target)' });
    }

    try {
      const inputs = Array.isArray(input) ? input : [input];
      const data = [];
      let totalChars = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      
      let usedModel = '';
      for (let i = 0; i < inputs.length; i++) {
        const textToTranslate = inputs[i];
        totalChars += textToTranslate.length;
        promptTokens += Math.ceil(textToTranslate.length / 4);
        
        const result = await translateText(textToTranslate, sourceLanguage, targetLanguage, {
          beam_size: body.beam_size,
          max_batch_size: body.max_batch_size,
          num_hypotheses: body.num_hypotheses,
          repetition_penalty: body.repetition_penalty,
          ignore_cache: body.ignore_cache
        });
        
        completionTokens += Math.ceil(result.text.length / 4);
        usedModel = result.model; // all will generally use the same model
        
        data.push({
          text: result.text,
          index: i,
          source_language: result.source_language,
          target_language: result.target_language
        });
      }

      // Add to telemetry
      tokenCounter.add(totalChars);

      return reply.send({
        object: 'translation.list',
        model: usedModel,
        source_language: data[0]?.source_language || sourceLanguage,
        target_language: data[0]?.target_language || targetLanguage,
        data,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}
