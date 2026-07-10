import OpenAI from 'openai';
import crypto from 'node:crypto';
import { AI_CONFIG } from '../config';
import { redis } from './redis';

function getTranslationHash(text: string, src: string, target: string): string {
  return crypto.createHash('sha256').update(`${src}:${target}:${text}`).digest('hex');
}

export async function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  const cleanText = (text || '').trim();
  if (!cleanText) return '';

  const cacheKey = `translation:${sourceLanguage}:${targetLanguage}:${getTranslationHash(cleanText, sourceLanguage, targetLanguage)}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.warn('[AI Gateway] Translation cache read error:', err);
  }

  let result = '';

  if (AI_CONFIG.translation.provider === 'local') {
    try {
      const response = await fetch(AI_CONFIG.translation.localUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'local-translator',
          input: [cleanText],
          source_language: sourceLanguage,
          target_language: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Local translation failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      result = data.data?.[0]?.text || '';
    } catch (err) {
      console.warn('[AI Gateway] Local translation failed, trying external fallback...', err);
      result = await fetchExternalTranslation(cleanText, sourceLanguage, targetLanguage);
    }
  } else {
    result = await fetchExternalTranslation(cleanText, sourceLanguage, targetLanguage);
  }

  if (result) {
    try {
      if (AI_CONFIG.translation.cacheTtl === -1) {
        await redis.set(cacheKey, result);
      } else {
        await redis.set(cacheKey, result, 'EX', AI_CONFIG.translation.cacheTtl);
      }
    } catch (err) {
      console.warn('[AI Gateway] Translation cache write error:', err);
    }
  }

  return result;
}

async function fetchExternalTranslation(text: string, src: string, target: string): Promise<string> {
  const client = new OpenAI({
    baseURL: AI_CONFIG.translation.externalUrl.replace('/v1/chat/completions', '/v1'),
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `You are a professional translator. Translate from ${src} to ${target}. Output ONLY the translated text, without quotes or extra formatting.` },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}
