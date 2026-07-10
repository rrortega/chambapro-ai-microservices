import OpenAI from 'openai';
import { AI_CONFIG } from '../config';

export async function getEmbeddings(text: string): Promise<number[]> {
  const cleanText = (text || '').trim();
  if (!cleanText) return new Array(384).fill(0);
  const truncatedText = cleanText.substring(0, 8000);

  if (AI_CONFIG.embeddings.provider === 'local') {
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
  } else {
    const client = new OpenAI({
      baseURL: AI_CONFIG.embeddings.externalUrl.replace('/v1/embeddings', '/v1'),
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    const response = await client.embeddings.create({
      model: "text-embedding-3-small", 
      input: truncatedText,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  }
}
