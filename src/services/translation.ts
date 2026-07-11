import OpenAI from 'openai';
import crypto from 'node:crypto';
import { AI_CONFIG } from '../config';
import { redis } from './redis';
import { fallbackCounter } from '../telemetry';

function getTranslationHash(text: string, src: string, target: string): string {
  return crypto.createHash('sha256').update(`${src}:${target}:${text}`).digest('hex');
}

export async function translateText(text: string, sourceLanguage: string, targetLanguage: string, options: any = {}): Promise<{text: string, model: string, source_language: string, target_language: string}> {
  const cleanText = (text || '').trim();
  if (!cleanText) return { text: '', model: 'none', source_language: sourceLanguage, target_language: targetLanguage };

  const optionsHash = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex');
  const cacheKey = `translation:${sourceLanguage}:${targetLanguage}:${optionsHash}:${getTranslationHash(cleanText, sourceLanguage, targetLanguage)}`;

  if (!options.ignore_cache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.text) return parsed;
        } catch (e) {
          return { text: cached, model: 'cached-unknown', source_language: sourceLanguage, target_language: targetLanguage };
        }
      }
    } catch (err) {
      console.warn('[AI Gateway] Translation cache read error:', err);
    }
  }

  let result = '';
  let usedModel = '';
  let detectedSrc = sourceLanguage;
  let detectedTgt = targetLanguage;

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
          ...options
        }),
      });

      if (!response.ok) {
        throw new Error(`Local translation failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      result = data.translation || data.translatedText || data.data?.[0]?.text || '';
      usedModel = data.model || 'local-translator';
      detectedSrc = data.source_language || detectedSrc;
      detectedTgt = data.target_language || detectedTgt;
    } catch (err) {
      console.warn('[AI Gateway] Local translation failed, trying external fallback...', err);
      fallbackCounter.add(1);
      const extRes = await fetchExternalTranslation(cleanText, sourceLanguage, targetLanguage);
      result = extRes.text;
      usedModel = extRes.model;
      detectedSrc = extRes.source_language;
      detectedTgt = extRes.target_language;
    }
  } else {
    const extRes = await fetchExternalTranslation(cleanText, sourceLanguage, targetLanguage);
    result = extRes.text;
    usedModel = extRes.model;
    detectedSrc = extRes.source_language;
    detectedTgt = extRes.target_language;
  }

  if (result) {
    try {
      const cacheVal = JSON.stringify({ text: result, model: usedModel, source_language: detectedSrc, target_language: detectedTgt });
      if (AI_CONFIG.translation.cacheTtl === -1) {
        await redis.set(cacheKey, cacheVal);
      } else {
        await redis.set(cacheKey, cacheVal, 'EX', AI_CONFIG.translation.cacheTtl);
      }
    } catch (err) {
      console.warn('[AI Gateway] Translation cache write error:', err);
    }
  }

  return { text: result, model: usedModel, source_language: detectedSrc, target_language: detectedTgt };
}

async function fetchExternalTranslation(text: string, src: string, target: string): Promise<{text: string, model: string, source_language: string, target_language: string}> {
  if (!AI_CONFIG.translation.externalApiKey) {
    throw new Error("Local model is not ready or failed, and OpenAI fallback is not configured (missing API key). Please wait for the local model to finish downloading or set OPENAI_API_KEY.");
  }
  const client = new OpenAI({
    baseURL: AI_CONFIG.translation.externalUrl.replace('/v1/chat/completions', '/v1'),
    apiKey: AI_CONFIG.translation.externalApiKey,
  });

  const response = await client.chat.completions.create({
    model: AI_CONFIG.translation.externalModel,
    messages: [
      { role: 'system', content: `You are a professional translator. Translate from ${src} to ${target}. Output ONLY the translated text, without quotes or extra formatting.` },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
  });

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    model: response.model || AI_CONFIG.translation.externalModel,
    source_language: src,
    target_language: target
  };
}
