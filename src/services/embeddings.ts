import OpenAI from 'openai';
import { AI_CONFIG } from '../config';
import { fallbackCounter } from '../telemetry';

export async function getEmbeddings(text: string, options: any = {}): Promise<number[]> {
  const cleanText = (text || '').trim();
  if (!cleanText) return new Array(384).fill(0);
  const truncatedText = cleanText.substring(0, 8000);

  // Clean undefined options
  const validOptions = Object.fromEntries(Object.entries(options).filter(([_, v]) => v !== undefined));

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
        ...validOptions
      } as any);
      return response.data[0].embedding;
    } catch (err) {
      console.warn('[AI Gateway] Local embeddings failed, trying external fallback...', err);
      fallbackCounter.add(1);
      return await fetchExternalEmbeddings(truncatedText, validOptions);
    }
  } else {
    return await fetchExternalEmbeddings(truncatedText, validOptions);
  }
}

async function fetchExternalEmbeddings(text: string, options: any = {}): Promise<number[]> {
  if (!AI_CONFIG.embeddings.externalApiKey) {
    throw new Error("Local model is not ready or failed, and OpenAI fallback is not configured (missing API key). Please wait for the local model to finish downloading or set OPENAI_API_KEY.");
  }
  const client = new OpenAI({
    baseURL: AI_CONFIG.embeddings.externalUrl.replace('/v1/embeddings', '/v1'),
    apiKey: AI_CONFIG.embeddings.externalApiKey,
  });
  const response = await client.embeddings.create({
    model: AI_CONFIG.embeddings.externalModel, 
    input: text,
    encoding_format: "float",
    ...options
  } as any);
  return response.data[0].embedding;
}
