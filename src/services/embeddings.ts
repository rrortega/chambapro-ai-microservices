import OpenAI from 'openai';
import { AI_CONFIG } from '../config';
import { fallbackCounter } from '../telemetry';

export async function getEmbeddings(text: string): Promise<number[]> {
  const cleanText = (text || '').trim();
  if (!cleanText) return new Array(384).fill(0);
  const truncatedText = cleanText.substring(0, 8000);

  if (AI_CONFIG.embeddings.provider === 'local') {
    try {
      const client = new OpenAI({
        baseURL: AI_CONFIG.embeddings.localUrl.replace('/v1/embeddings', '/v1'),
        apiKey: AI_CONFIG.internalApiKey,
      });
      const response = await client.embeddings.create({
        model: "multilingual-e5-small",
        input: truncatedText,
        encoding_format: "float",
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn('[AI Gateway] Local embeddings failed, trying external fallback...', err);
      fallbackCounter.add(1);
      return await fetchExternalEmbeddings(truncatedText);
    }
  } else {
    return await fetchExternalEmbeddings(truncatedText);
  }
}

async function fetchExternalEmbeddings(text: string): Promise<number[]> {
  const client = new OpenAI({
    baseURL: AI_CONFIG.embeddings.externalUrl.replace('/v1/embeddings', '/v1'),
    apiKey: AI_CONFIG.embeddings.externalApiKey,
  });
  const response = await client.embeddings.create({
    model: AI_CONFIG.embeddings.externalModel, 
    input: text,
    encoding_format: "float",
  });
  return response.data[0].embedding;
}
